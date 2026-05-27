package com.blasetvrtumi.rarecips.service;

import com.blasetvrtumi.rarecips.entity.Notification;
import com.blasetvrtumi.rarecips.entity.User;
import com.blasetvrtumi.rarecips.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    public Notification createAndSendNotification(User recipient, User sender, Notification.NotificationType type, String message, Long relatedId) {
        Notification notification = new Notification(recipient, sender, type, message, relatedId);
        notification = notificationRepository.save(notification);

        NotificationWsMessage wsMessage = new NotificationWsMessage(
                notification.getId(),
                recipient != null ? recipient.getUsername() : null,
                sender != null ? sender.getUsername() : null,
                notification.getType(),
                notification.getMessage(),
                null,
                null,
                notification.getRelatedId(),
                notification.isRead(),
                notification.getCreatedAt()
        );

        messagingTemplate.convertAndSendToUser(
                recipient.getUsername(),
                "/queue/notifications",
                wsMessage
        );

        return notification;
    }

    public Notification createAndSendNotificationWithTemplate(User recipient, User sender, Notification.NotificationType type, Map<String, String> messageArgs, String messageKey, Long relatedId) {
        Notification notification = new Notification(recipient, sender, type, "", messageArgs, messageKey, relatedId);
        notification = notificationRepository.save(notification);

        NotificationWsMessage wsMessage = new NotificationWsMessage(
                notification.getId(),
                recipient != null ? recipient.getUsername() : null,
                sender != null ? sender.getUsername() : null,
                notification.getType(),
                notification.getMessage(),
                messageKey,
                messageArgs,
                notification.getRelatedId(),
                notification.isRead(),
                notification.getCreatedAt()
        );

        messagingTemplate.convertAndSendToUser(
                recipient.getUsername(),
                "/queue/notifications",
                wsMessage
        );

        return notification;
    }

    public void markAsRead(Long notificationId, User user) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (notification.getRecipient().getUsername().equals(user.getUsername())) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        });
    }

    public void markAllAsRead(User user) {
        notificationRepository.markAllAsRead(user);
    }

    private record NotificationWsMessage(
            Long id,
            String recipientUsername,
            String senderUsername,
            Notification.NotificationType type,
            String message,
            String messageKey,
            Map<String, String> messageArgs,
            Long relatedId,
            boolean read,
            LocalDateTime createdAt
    ) {}
}
