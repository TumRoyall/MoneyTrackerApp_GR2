package com.examples.moneytracker.auth.security;

import com.examples.moneytracker.user.model.User;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;

    public UUID getId() {
        return user.getUserId();
    }

    @Override
    public List<SimpleGrantedAuthority> getAuthorities() {
        if (user.getIsAdmin()) {
            return List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return user.getIsVerified(); }
}
