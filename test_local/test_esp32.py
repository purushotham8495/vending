#!/usr/bin/env python3
"""
ESP32 Automated Test Script

This script provides automated testing for ESP32 GPIO functionality
through serial connection. No server required.

Features:
- Automated GPIO testing
- Serial command interface
- Test reports
- Timing analysis
- Interactive mode

Requirements:
    pip install pyserial

Usage:
    python test_esp32.py --port COM3
    python test_esp32.py --port /dev/ttyUSB0
"""

import serial
import time
import argparse
import sys
from datetime import datetime

class ESP32Tester:
    def __init__(self, port, baudrate=115200):
        """Initialize ESP32 tester"""
        self.port = port
        self.baudrate = baudrate
        self.ser = None
        self.test_results = []
        
    def connect(self):
        """Connect to ESP32"""
        try:
            print(f"\n🔌 Connecting to ESP32 on {self.port}...")
            self.ser = serial.Serial(self.port, self.baudrate, timeout=2)
            time.sleep(2)  # Wait for ESP32 to reset
            print("✅ Connected successfully!\n")
            return True
        except Exception as e:
            print(f"❌ Connection failed: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from ESP32"""
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("\n👋 Disconnected from ESP32")
    
    def send_command(self, command, wait_time=1):
        """Send command to ESP32 and read response"""
        if not self.ser or not self.ser.is_open:
            print("❌ Not connected to ESP32")
            return None
        
        try:
            # Clear input buffer
            self.ser.reset_input_buffer()
            
            # Send command
            self.ser.write(f"{command}\n".encode())
            print(f"📤 Sent: {command}")
            
            # Wait for response
            time.sleep(wait_time)
            
            # Read response
            response = []
            while self.ser.in_waiting:
                line = self.ser.readline().decode('utf-8', errors='ignore').strip()
                if line:
                    response.append(line)
                    print(f"📥 {line}")
            
            return response
        
        except Exception as e:
            print(f"❌ Error sending command: {e}")
            return None
    
    def test_single_gpio(self, gpio_index):
        """Test a single GPIO"""
        print(f"\n🧪 Testing GPIO {gpio_index}...")
        
        # Turn ON
        print(f"  ⚡ Turning ON...")
        response = self.send_command(f"on{gpio_index}", 0.5)
        
        # Wait
        time.sleep(1)
        
        # Turn OFF
        print(f"  🔴 Turning OFF...")
        response = self.send_command(f"off{gpio_index}", 0.5)
        
        return True
    
    def test_all_gpios(self, num_gpios=6):
        """Test all GPIOs sequentially"""
        print("\n" + "="*60)
        print("🧪 TESTING ALL GPIOs")
        print("="*60)
        
        results = []
        
        for i in range(num_gpios):
            start_time = time.time()
            success = self.test_single_gpio(i)
            duration = time.time() - start_time
            
            results.append({
                'gpio': i,
                'success': success,
                'duration': duration
            })
            
            time.sleep(0.5)
        
        self.test_results.extend(results)
        return results
    
    def test_toggle(self, gpio_index, count=3):
        """Test toggle function"""
        print(f"\n🔄 Testing Toggle GPIO {gpio_index} ({count} times)...")
        
        for i in range(count):
            print(f"  Toggle {i+1}/{count}...")
            self.send_command(f"t{gpio_index}", 0.5)
            time.sleep(1)
        
        return True
    
    def test_pulse(self, gpio_index, duration=2000):
        """Test pulse function"""
        print(f"\n⏱️  Testing Pulse GPIO {gpio_index} for {duration}ms...")
        
        start_time = time.time()
        self.send_command(f"p{gpio_index}:{duration}", duration/1000 + 1)
        elapsed = time.time() - start_time
        
        print(f"  ✅ Completed in {elapsed:.2f}s")
        return True
    
    def test_all_on_off(self):
        """Test all ON and all OFF"""
        print("\n🟢 Testing All ON...")
        self.send_command("allon", 2)
        
        time.sleep(2)
        
        print("\n🔴 Testing All OFF...")
        self.send_command("alloff", 2)
        
        return True
    
    def test_sequence(self):
        """Test predefined sequence"""
        print("\n▶️  Testing Sequence Execution...")
        response = self.send_command("sequence", 15)
        return True
    
    def get_status(self):
        """Get current status"""
        print("\n📊 Getting Status...")
        return self.send_command("status", 1)
    
    def list_gpios(self):
        """List all GPIOs"""
        print("\n📋 Listing GPIOs...")
        return self.send_command("list", 1)
    
    def run_full_test_suite(self):
        """Run complete test suite"""
        print("\n" + "="*60)
        print("🚀 STARTING FULL TEST SUITE")
        print("="*60)
        
        tests = [
            ("List GPIOs", lambda: self.list_gpios()),
            ("Get Status", lambda: self.get_status()),
            ("Test All GPIOs", lambda: self.test_all_gpios()),
            ("Test Toggle", lambda: self.test_toggle(0, 2)),
            ("Test Pulse", lambda: self.test_pulse(1, 2000)),
            ("Test All ON/OFF", lambda: self.test_all_on_off()),
            ("Test Sequence", lambda: self.test_sequence()),
        ]
        
        results = []
        
        for test_name, test_func in tests:
            print(f"\n{'='*60}")
            print(f"🧪 Running: {test_name}")
            print('='*60)
            
            try:
                start_time = time.time()
                success = test_func()
                duration = time.time() - start_time
                
                results.append({
                    'test': test_name,
                    'success': True,
                    'duration': duration
                })
                
                print(f"✅ {test_name} PASSED ({duration:.2f}s)")
                
            except Exception as e:
                print(f"❌ {test_name} FAILED: {e}")
                results.append({
                    'test': test_name,
                    'success': False,
                    'error': str(e)
                })
            
            time.sleep(1)
        
        # Print summary
        self.print_test_summary(results)
        
        return results
    
    def print_test_summary(self, results):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for r in results if r['success'])
        total = len(results)
        
        print(f"\nTotal Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {total - passed} ❌")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print("\n" + "-"*60)
        print("Individual Results:")
        print("-"*60)
        
        for r in results:
            status = "✅" if r['success'] else "❌"
            duration = f"{r.get('duration', 0):.2f}s" if 'duration' in r else "N/A"
            print(f"{status} {r['test']:<30} {duration:>10}")
        
        print("="*60 + "\n")
    
    def interactive_mode(self):
        """Interactive command mode"""
        print("\n" + "="*60)
        print("🎮 INTERACTIVE MODE")
        print("="*60)
        print("\nType commands to send to ESP32")
        print("Type 'exit' or 'quit' to exit")
        print("Type 'help' to see available commands\n")
        
        while True:
            try:
                command = input("esp32> ").strip()
                
                if command.lower() in ['exit', 'quit']:
                    break
                
                if command:
                    self.send_command(command, 1)
                    
            except KeyboardInterrupt:
                print("\n\n👋 Exiting interactive mode...")
                break
            except Exception as e:
                print(f"❌ Error: {e}")

def main():
    parser = argparse.ArgumentParser(description='ESP32 GPIO Tester')
    parser.add_argument('--port', '-p', required=True, help='Serial port (e.g., COM3 or /dev/ttyUSB0)')
    parser.add_argument('--baudrate', '-b', type=int, default=115200, help='Baud rate (default: 115200)')
    parser.add_argument('--test', '-t', choices=['full', 'quick', 'interactive'], default='interactive', 
                        help='Test mode: full, quick, or interactive')
    
    args = parser.parse_args()
    
    # Create tester
    tester = ESP32Tester(args.port, args.baudrate)
    
    # Connect
    if not tester.connect():
        sys.exit(1)
    
    try:
        # Run selected test mode
        if args.test == 'full':
            tester.run_full_test_suite()
        elif args.test == 'quick':
            tester.list_gpios()
            tester.get_status()
            tester.test_all_gpios()
        else:  # interactive
            tester.interactive_mode()
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    
    finally:
        # Cleanup
        tester.disconnect()

if __name__ == '__main__':
    main()
