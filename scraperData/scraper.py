from datetime import datetime, timedelta
import time

def scrap():
    print("hello world")

while 1:
    scrap()

    dt = datetime.now() + timedelta(minutes=1)

    while datetime.now() < dt:
        time.sleep(1)