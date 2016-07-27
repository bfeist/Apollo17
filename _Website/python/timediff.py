__author__ = 'Feist'
import csv

input_file_path = "./timeinfo.txt"
csv_reader = csv.reader(open(input_file_path, "rU"), delimiter='-')
firstSeconds = 0
offsetStartSeconds = 60
for csv_row in csv_reader:
    if len(csv_row) < 3: #list that hasn't been processed yet
        arrayOffset = 0
    else:
        arrayOffset = 1
    # print csv_row[0]
    splitTimestamp = csv_row[0 + arrayOffset].split(":")
    totalSeconds = (int(splitTimestamp[0]) * 60 *60) + (int(splitTimestamp[1]) * 60) + int(splitTimestamp[2])
    # print "totalSeconds: " + str(totalSeconds)
    if firstSeconds != 0:
        thisSeconds = totalSeconds - firstSeconds + offsetStartSeconds
    else:
        thisSeconds = 0 + offsetStartSeconds
        firstSeconds = totalSeconds

    m, s = divmod(thisSeconds, 60)
    h, m = divmod(m, 60)
    print "%d:%02d:%02d" % (h, m, s) + " - " + csv_row[0 + arrayOffset].strip() + " - " + csv_row[1 + arrayOffset].strip()
    # print "thisSeconds: " + str(thisSeconds)