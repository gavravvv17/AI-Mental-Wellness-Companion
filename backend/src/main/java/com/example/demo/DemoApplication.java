package com.example.demo;

import com.example.demo.service.InMemoryDatabase;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Bean
	public CommandLineRunner initInMemoryDb() {
		return args -> {
			BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
			InMemoryDatabase.initialize(encoder.encode("password123"));
		};
	}
}
