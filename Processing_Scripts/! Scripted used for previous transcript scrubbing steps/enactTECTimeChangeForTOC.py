import sys
import fileinput
import math

def getsec(timeString):
    l = timeString.split(':')
    #print l
    return (int(l[0]) * 3600) + (int(l[1]) * 60) + int(l[2])

def gettimefromseconds(secs):
    m, s = divmod(secs, 60)
    h, m = divmod(m, 60)
    return "%03d:%02d:%02d" % (h, m, s)

original = sys.stdout

for i, line in enumerate(fileinput.input("E:\\Apollo17.org\\MISSION_DATA\\Mission TOC.csv", inplace = 1)):
    origTimestamp = line.split('|')[0]
    if origTimestamp != "":
        origTimestampSeconds = getsec(origTimestamp)
        clockCorrectedTimestampSeconds = int(origTimestampSeconds) + 9600 #9600 seconds is 2 hours 40 minutes - the Apollo 17 clock correction amount
        clockCorrectedTimestamp = gettimefromseconds(clockCorrectedTimestampSeconds)
        if origTimestampSeconds >= 234000: #if current line is after 065:00:00 then bump the timestamp up by 2 hours, 40 minutes as per mission clock correction
            sys.stdout.write(line.replace(origTimestamp, clockCorrectedTimestamp))
        else:
            sys.stdout.write(line)
    else:
        sys.stdout.write(line)