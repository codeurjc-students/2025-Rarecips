package com.blasetvrtumi.rarecips.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

@Entity
public class Notification {

    public interface BasicInfo {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonView(BasicInfo.class)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_username", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "recipes", "reviews", "savedRecipes", "ingredients"})
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_username")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "recipes", "reviews", "savedRecipes", "ingredients"})
    private User sender;

    @Enumerated(EnumType.STRING)
    @JsonView(BasicInfo.class)
    private NotificationType type;

    @JsonView(BasicInfo.class)
    private String message;

    @JsonView(BasicInfo.class)
    private String messageKey;

    @Column(columnDefinition = "TEXT")
    private String messageArgsJson;

    @JsonView(BasicInfo.class)
    private Long relatedId;

    @JsonView(BasicInfo.class)
    private boolean isRead = false;

    @CreationTimestamp
    @JsonView(BasicInfo.class)
    private LocalDateTime createdAt;

    public enum NotificationType {
        WELCOME,
        REPORTED_USER,
        REPORTED_RECIPE,
        REPORTED_REVIEW,
        LIKED_RECIPE,
        ADDED_TO_COLLECTION,
        REVIEW_ADDED
    }

    public Notification() {}

    public Notification(User recipient, User sender, NotificationType type, String message, Long relatedId) {
        this.recipient = recipient;
        this.sender = sender;
        this.type = type;
        this.message = message;
        this.relatedId = relatedId;
        this.isRead = false;
    }

    public Notification(User recipient, User sender, NotificationType type, String message, java.util.Map<String, String> messageArgs, String messageKey, Long relatedId) {
        this.recipient = recipient;
        this.sender = sender;
        this.type = type;
        this.message = message;
        this.relatedId = relatedId;
        this.isRead = false;
        this.messageKey = messageKey;
        try {
            this.messageArgsJson = messageArgs != null ? new ObjectMapper().writeValueAsString(messageArgs) : null;
        } catch (Exception e) {
            this.messageArgsJson = null;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getMessageKey() {
        return messageKey;
    }

    public void setMessageKey(String messageKey) {
        this.messageKey = messageKey;
    }

    @JsonView(BasicInfo.class)
    public Map<String, String> getMessageArgs() {
        if (this.messageArgsJson == null) return null;
        try {
            return new ObjectMapper().readValue(this.messageArgsJson, new TypeReference<Map<String,String>>(){});
        } catch (Exception e) {
            return null;
        }
    }

    public void setMessageArgs(Map<String, String> args) {
        try {
            this.messageArgsJson = args != null ? new ObjectMapper().writeValueAsString(args) : null;
        } catch (Exception e) {
            this.messageArgsJson = null;
        }
    }

    public Long getRelatedId() {
        return relatedId;
    }

    public void setRelatedId(Long relatedId) {
        this.relatedId = relatedId;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @JsonView(BasicInfo.class)
    public String getRecipientUsername() {
        return recipient != null ? recipient.getUsername() : null;
    }

    @JsonView(BasicInfo.class)
    public String getSenderUsername() {
        return sender != null ? sender.getUsername() : null;
    }
}
