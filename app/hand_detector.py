"""
Simple and Reliable Hand Detector
Works with 1 or 2 hands for steering control.
"""

import cv2
import mediapipe as mp
import numpy as np


class HandDetector:
    """
    Simple hand detection that WORKS.
    - Detects 1 or 2 hands
    - Returns steering angle based on hand position
    - Simple gesture detection
    """
    
    def __init__(self, max_hands=2, detection_confidence=0.5, tracking_confidence=0.5):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_hands,
            min_detection_confidence=detection_confidence,
            min_tracking_confidence=tracking_confidence,
            model_complexity=0  # Fast
        )
        self.mp_draw = mp.solutions.drawing_utils
        self.last_angle = 0.0
        
    def detect(self, frame):
        """
        Detect hands and return steering angle.
        Returns: (frame, angle, hand_count, gesture, confidence, openness)
        """
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)
        
        hand_count = 0
        angle = 0.0
        gesture = 0
        confidence = 0.0
        openness = 0.5
        
        h, w = frame.shape[:2]
        
        if results.multi_hand_landmarks:
            hand_count = len(results.multi_hand_landmarks)
            x_positions = []
            
            for hand_landmarks in results.multi_hand_landmarks:
                # Draw hand
                self.mp_draw.draw_landmarks(
                    frame, hand_landmarks, self.mp_hands.HAND_CONNECTIONS,
                    self.mp_draw.DrawingSpec(color=(0, 255, 255), thickness=2),
                    self.mp_draw.DrawingSpec(color=(255, 0, 255), thickness=2)
                )
                
                # Get wrist position (most stable point)
                wrist = hand_landmarks.landmark[0]
                x_positions.append(wrist.x)
                
                # Check gesture
                g = self._check_gesture(hand_landmarks)
                if g > gesture:
                    gesture = g
                    
                # Openness
                openness = self._get_openness(hand_landmarks)
                
                # Confidence
                if results.multi_handedness:
                    for hd in results.multi_handedness:
                        confidence = max(confidence, hd.classification[0].score)
            
            # Calculate steering angle from hand position
            if len(x_positions) == 2:
                avg_x = sum(x_positions) / 2
            else:
                avg_x = x_positions[0]
            
            # Map to angle: left (0) = -90, center (0.5) = 0, right (1) = +90
            raw_angle = (avg_x - 0.5) * 180
            
            # Light smoothing
            angle = 0.7 * raw_angle + 0.3 * self.last_angle
            self.last_angle = angle
        else:
            # No hands - return to center
            angle = self.last_angle * 0.8
            self.last_angle = angle
        
        # Draw indicator
        self._draw_indicator(frame, angle, hand_count)
        
        return frame, angle, hand_count, gesture, confidence, openness
    
    def _check_gesture(self, landmarks):
        """
        0 = neutral
        1 = fist (brake)
        2 = open hand (all fingers up = nitro)
        3 = thumbs up
        """
        # Count fingers up
        tips = [8, 12, 16, 20]  # Index, Middle, Ring, Pinky
        pips = [6, 10, 14, 18]
        
        fingers_up = 0
        for tip, pip in zip(tips, pips):
            if landmarks.landmark[tip].y < landmarks.landmark[pip].y:
                fingers_up += 1
        
        # Check thumb
        thumb_tip = landmarks.landmark[4]
        thumb_ip = landmarks.landmark[3]
        thumb_out = abs(thumb_tip.x - landmarks.landmark[0].x) > abs(thumb_ip.x - landmarks.landmark[0].x)
        
        if fingers_up >= 4:  # All fingers up
            return 2  # Open hand = NITRO
        elif fingers_up == 0 and not thumb_out:
            return 1  # Fist = brake
        elif fingers_up == 0 and thumb_out and thumb_tip.y < landmarks.landmark[2].y:
            return 3  # Thumbs up
        
        return 0
    
    def _get_openness(self, landmarks):
        """How open is the hand (0-1)"""
        thumb = landmarks.landmark[4]
        pinky = landmarks.landmark[20]
        wrist = landmarks.landmark[0]
        
        span = np.sqrt((thumb.x - pinky.x)**2 + (thumb.y - pinky.y)**2)
        palm = np.sqrt((landmarks.landmark[9].x - wrist.x)**2 + (landmarks.landmark[9].y - wrist.y)**2)
        
        return min(1.0, span / (palm * 2 + 0.001))
    
    def _draw_indicator(self, frame, angle, hands):
        """Draw steering indicator on frame"""
        h, w = frame.shape[:2]
        cx, cy = w // 2, h - 50
        r = 35
        
        # Circle
        color = (0, 255, 0) if hands > 0 else (128, 128, 128)
        cv2.circle(frame, (cx, cy), r, color, 2)
        
        # Direction line
        rad = np.radians(angle)
        ex = int(cx + r * np.sin(rad))
        ey = int(cy - r * np.cos(rad))
        cv2.line(frame, (cx, cy), (ex, ey), color, 3)
        
        # Text
        text = f"Hands: {hands} | Angle: {angle:.0f}"
        cv2.putText(frame, text, (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    def reset(self):
        self.last_angle = 0.0
