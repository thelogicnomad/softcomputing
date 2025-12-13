"""
Racing Game - Simple and Fun with Working Collisions
"""

import time
import random
from dataclasses import dataclass
from typing import List, Dict


@dataclass
class Car:
    x: float      # -1 to 1 (lane position)
    z: float      # Distance from player (0 = horizon, 1 = near player)
    speed: float  # Car's speed
    color: str


@dataclass  
class PowerUp:
    x: float
    z: float
    type: str


class RacingGame:
    """Simple racing game with working collision detection"""
    
    def __init__(self):
        self.reset()
        
    def reset(self):
        """Reset game state"""
        self.player_x = 0.0       # -1 to 1
        self.player_speed = 0.0   # Current speed
        self.max_speed = 150.0
        
        self.score = 0
        self.distance = 0.0
        self.game_over = False
        self.game_time = 0.0
        
        # Nitro
        self.nitro = 100.0
        self.nitro_active = False
        
        # Traffic cars
        self.traffic: List[Car] = []
        self.spawn_timer = 0.0
        
        # Power-ups
        self.powerups: List[PowerUp] = []
        
        # Shield
        self.shield = False
        self.shield_timer = 0.0
        
        # Invincibility after hit (for shield breaking)
        self.invincible = False
        self.invincible_timer = 0.0
        
        # Timing
        self.last_update = time.time()
        self.road_offset = 0.0
        
    def update(self, steering: float, speed_input: float, nitro_input: float = 0) -> Dict:
        """Update game state"""
        current = time.time()
        dt = min(current - self.last_update, 0.1)
        self.last_update = current
        
        if self.game_over:
            return self.get_state()
        
        self.game_time += dt
        
        # === SPEED ===
        target_speed = (speed_input / 100.0) * self.max_speed
        
        # Nitro boost
        if nitro_input > 50 and self.nitro > 0:
            self.nitro_active = True
            self.nitro = max(0, self.nitro - 30 * dt)
            target_speed = min(self.max_speed * 1.3, target_speed * 1.4)
        else:
            self.nitro_active = False
            self.nitro = min(100, self.nitro + 10 * dt)
        
        # Smooth acceleration
        if target_speed > self.player_speed:
            self.player_speed += 80 * dt  # Accelerate
        else:
            self.player_speed -= 100 * dt  # Decelerate
        
        self.player_speed = max(0, min(self.max_speed * 1.3, self.player_speed))
        
        # === STEERING ===
        steer_amount = (steering / 100.0) * 1.5 * dt
        self.player_x += steer_amount
        self.player_x = max(-0.8, min(0.8, self.player_x))
        
        # === DISTANCE & SCORE ===
        self.distance += self.player_speed * dt
        self.score += int(self.player_speed * dt * 0.3)
        
        # Road animation
        self.road_offset += self.player_speed * dt * 0.01
        if self.road_offset > 1:
            self.road_offset -= 1
        
        # === SPAWN TRAFFIC ===
        self.spawn_timer += dt
        spawn_interval = max(1.5, 3.0 - (self.game_time / 60.0))  # Spawn every 1.5-3 seconds
        
        if self.spawn_timer > spawn_interval and len(self.traffic) < 4:
            self.spawn_timer = 0
            
            # Pick a lane
            lanes = [-0.55, 0, 0.55]
            lane = random.choice(lanes)
            
            # Traffic speed is SLOWER than max player speed
            traffic_speed = 30 + random.uniform(0, 30)  # 30-60, player can go 150
            
            self.traffic.append(Car(
                x=lane,
                z=0.0,  # Start at horizon
                speed=traffic_speed,
                color=random.choice(['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'])
            ))
        
        # === UPDATE TRAFFIC ===
        for car in self.traffic:
            # Car moves towards player based on relative speed
            relative_speed = self.player_speed - car.speed
            car.z += relative_speed * dt * 0.008  # Move towards player
        
        # Remove cars that passed player
        self.traffic = [c for c in self.traffic if c.z < 1.2]
        
        # === SPAWN POWER-UPS ===
        if len(self.powerups) < 1 and random.random() < 0.01 * dt * 60:
            lane = random.choice([-0.5, 0, 0.5])
            self.powerups.append(PowerUp(
                x=lane,
                z=0.0,
                type=random.choice(['nitro', 'shield', 'points'])
            ))
        
        # Update power-ups
        for pu in self.powerups:
            pu.z += self.player_speed * dt * 0.008
        self.powerups = [p for p in self.powerups if p.z < 1.2]
        
        # === TIMERS ===
        if self.shield:
            self.shield_timer -= dt
            if self.shield_timer <= 0:
                self.shield = False
                
        if self.invincible:
            self.invincible_timer -= dt
            if self.invincible_timer <= 0:
                self.invincible = False
        
        # === COLLISION DETECTION ===
        self._check_collisions()
        
        return self.get_state()
    
    def _check_collisions(self):
        """Check for collisions with traffic and power-ups"""
        if self.invincible:
            return
        
        # Player collision zone: z between 0.75 and 0.95
        player_z_min = 0.75
        player_z_max = 0.95
        
        # Check traffic collisions
        for car in self.traffic[:]:
            # Check if car is in collision zone
            if player_z_min < car.z < player_z_max:
                # Check horizontal overlap
                x_distance = abs(car.x - self.player_x)
                if x_distance < 0.25:  # Collision!
                    if self.shield:
                        # Shield protects
                        self.shield = False
                        self.invincible = True
                        self.invincible_timer = 1.0
                        self.traffic.remove(car)
                        self.score += 50
                    else:
                        # GAME OVER!
                        self.game_over = True
                        return
        
        # Check power-up collection
        for pu in self.powerups[:]:
            if 0.7 < pu.z < 1.0:
                if abs(pu.x - self.player_x) < 0.25:
                    self._collect_powerup(pu)
                    self.powerups.remove(pu)
    
    def _collect_powerup(self, pu: PowerUp):
        """Collect a power-up"""
        if pu.type == 'nitro':
            self.nitro = min(100, self.nitro + 50)
            self.score += 30
        elif pu.type == 'shield':
            self.shield = True
            self.shield_timer = 10.0
            self.score += 50
        elif pu.type == 'points':
            self.score += 200
    
    def get_state(self) -> Dict:
        """Get game state for frontend"""
        return {
            'player_x': self.player_x,
            'speed': self.player_speed,
            'max_speed': self.max_speed,
            'score': self.score,
            'distance': self.distance,
            'game_time': self.game_time,
            'nitro': self.nitro,
            'nitro_active': self.nitro_active,
            'shield': self.shield,
            'invincible': self.invincible,
            'game_over': self.game_over,
            'road_offset': self.road_offset,
            'traffic': [{'x': c.x, 'z': c.z, 'color': c.color} for c in self.traffic],
            'powerups': [{'x': p.x, 'z': p.z, 'type': p.type} for p in self.powerups]
        }
