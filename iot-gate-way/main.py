import time
import config
from adafruit_handler import AdafruitGateway
from serial_handler import YoloSerial
from logic_engine import apply_smart_logic, get_status_color

current_pump = 0
last_publish = 0

def handle_message(client, feed_id, payload):
    global current_pump
    print(f"[CLOUD] Lệnh: {feed_id} -> {payload}")
    if feed_id == config.FEED_PUMP:
        current_pump = int(payload)
        yolo.send_command("PUMP", current_pump)
    elif feed_id == config.FEED_RELAY:
        yolo.send_command("RELAY", int(payload))

yolo = YoloSerial(config.BAUD_RATE) 
ada = AdafruitGateway(handle_message)

while True:
    ada.loop()
    data = yolo.read_full_data()
    
    if data:
        t, s = data.get('T', 0), data.get('S', 0)
        new_state = apply_smart_logic(t, s, current_pump)
        if new_state is not None:
            current_pump = new_state
            yolo.send_command("PUMP", current_pump)
            ada.client.publish(config.FEED_PUMP, current_pump)

        if time.time() - last_publish > 20: 
            ada.publish_all(data)
            
            # Cập nhật thông tin cho LCD ảo trên Dashboard
            color, status_text = get_status_color(t, s)
            ada.client.publish(config.FEED_RGB, color)
            
            p_st = "ON" if current_pump == 1 else "OFF"
            lcd_msg = f"[{status_text}] P:{p_st} | T:{t} H:{data.get('H',0)} | S:{s} L:{data.get('L',0)}"
            ada.client.publish(config.FEED_LCD, lcd_msg)
            
            last_publish = time.time()

    time.sleep(0.1)