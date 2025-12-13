"""
Simple Fuzzy Controller for Racing Game
Direct and responsive control mapping.
"""

import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl


class FuzzySteeringController:
    """
    Simple fuzzy controller that maps:
    - Hand angle -> Steering (-100 to +100)
    - Hand count -> Speed (0/50/100)
    - Gesture -> Nitro
    """
    
    def __init__(self):
        self.last_steer = 0.0
        self.last_speed = 0.0
        self._setup()
        
    def _setup(self):
        """Setup fuzzy system"""
        # Inputs
        self.angle = ctrl.Antecedent(np.arange(-90, 91, 1), 'angle')
        self.hands = ctrl.Antecedent(np.arange(0, 3, 1), 'hands')
        
        # Outputs
        self.steering = ctrl.Consequent(np.arange(-100, 101, 1), 'steering')
        self.speed = ctrl.Consequent(np.arange(0, 101, 1), 'speed')
        
        # Angle membership - simple 5-level
        self.angle['left2'] = fuzz.trapmf(self.angle.universe, [-90, -90, -45, -20])
        self.angle['left1'] = fuzz.trimf(self.angle.universe, [-30, -15, 0])
        self.angle['center'] = fuzz.trimf(self.angle.universe, [-10, 0, 10])
        self.angle['right1'] = fuzz.trimf(self.angle.universe, [0, 15, 30])
        self.angle['right2'] = fuzz.trapmf(self.angle.universe, [20, 45, 90, 90])
        
        # Hands membership
        self.hands['zero'] = fuzz.trimf(self.hands.universe, [0, 0, 0.5])
        self.hands['one'] = fuzz.trimf(self.hands.universe, [0.5, 1, 1.5])
        self.hands['two'] = fuzz.trimf(self.hands.universe, [1.5, 2, 2])
        
        # Steering output - direct
        self.steering['left2'] = fuzz.trapmf(self.steering.universe, [-100, -100, -60, -30])
        self.steering['left1'] = fuzz.trimf(self.steering.universe, [-50, -25, 0])
        self.steering['straight'] = fuzz.trimf(self.steering.universe, [-5, 0, 5])
        self.steering['right1'] = fuzz.trimf(self.steering.universe, [0, 25, 50])
        self.steering['right2'] = fuzz.trapmf(self.steering.universe, [30, 60, 100, 100])
        
        # Speed output
        self.speed['stop'] = fuzz.trimf(self.speed.universe, [0, 0, 20])
        self.speed['slow'] = fuzz.trimf(self.speed.universe, [20, 50, 80])
        self.speed['fast'] = fuzz.trimf(self.speed.universe, [70, 100, 100])
        
        # Rules
        rules = [
            ctrl.Rule(self.angle['left2'], self.steering['left2']),
            ctrl.Rule(self.angle['left1'], self.steering['left1']),
            ctrl.Rule(self.angle['center'], self.steering['straight']),
            ctrl.Rule(self.angle['right1'], self.steering['right1']),
            ctrl.Rule(self.angle['right2'], self.steering['right2']),
            
            ctrl.Rule(self.hands['zero'], self.speed['stop']),
            ctrl.Rule(self.hands['one'], self.speed['slow']),
            ctrl.Rule(self.hands['two'], self.speed['fast']),
        ]
        
        self.system = ctrl.ControlSystem(rules)
        self.sim = ctrl.ControlSystemSimulation(self.system)
        
    def compute(self, angle: float, hand_count: int, gesture: int = 0) -> dict:
        """
        Compute control values.
        """
        angle = np.clip(angle, -89, 89)
        hands = np.clip(hand_count, 0, 2)
        
        try:
            self.sim.input['angle'] = angle
            self.sim.input['hands'] = hands
            self.sim.compute()
            
            steer = self.sim.output['steering']
            spd = self.sim.output['speed']
        except:
            # Fallback
            steer = angle * 1.1
            spd = 50 if hands > 0 else 0
        
        # Light smoothing
        steer = 0.8 * steer + 0.2 * self.last_steer
        spd = 0.7 * spd + 0.3 * self.last_speed
        self.last_steer = steer
        self.last_speed = spd
        
        # Gesture modifiers
        nitro = 0
        if gesture == 1:  # Fist = brake
            spd *= 0.3
        elif gesture == 2:  # Open hand = nitro
            nitro = 100
        
        return {
            'steering': float(steer),
            'speed': float(spd),
            'nitro': float(nitro),
            'gesture': int(gesture),
            'hand_count': int(hand_count)
        }
    
    def reset(self):
        self.last_steer = 0.0
        self.last_speed = 0.0
