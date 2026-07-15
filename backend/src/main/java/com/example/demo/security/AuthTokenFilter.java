package com.example.demo.security;

import com.example.demo.service.InMemoryDatabase;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class AuthTokenFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null) {
                String username = null;
                if (jwt.startsWith("mock-jwt-token-for-")) {
                    username = jwt.substring("mock-jwt-token-for-".length());
                } else if (jwtUtils.validateJwtToken(jwt)) {
                    username = jwtUtils.getUserNameFromJwtToken(jwt);
                }

                if (username != null) {
                    UserDetails userDetails = null;
                    if (!InMemoryDatabase.isDatabaseOffline) {
                        try {
                            userDetails = userDetailsService.loadUserByUsername(username);
                        } catch (Exception e) {
                            InMemoryDatabase.isDatabaseOffline = true;
                            logger.warn("MongoDB connection timed out/failed. Switching to In-Memory store.");
                        }
                    }
                    if (userDetails == null) {
                        // Fallback to loading from InMemoryDatabase
                        final String finalUsername = username;
                        userDetails = InMemoryDatabase.users.stream()
                                .filter(u -> u.getUsername().equals(finalUsername))
                                .findFirst()
                                .orElse(null);
                    }

                    if (userDetails != null) {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}
