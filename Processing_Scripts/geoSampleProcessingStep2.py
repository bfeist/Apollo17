__author__ = 'Feist'
import csv

input_file_path = "../../MISSION_DATA/geoSamples2.csv"
csv_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
firstSeconds = 0
offsetStartSeconds = 0
for csv_row in csv_reader:
    # totalSeconds = (int(splitTimestamp[0]) * 60 *60) + (int(splitTimestamp[1]) * 60) + int(splitTimestamp[2])
    # # print "totalSeconds: " + str(totalSeconds)
    # if firstSeconds != 0:
    #     thisSeconds = totalSeconds - firstSeconds + offsetStartSeconds
    # else:
    #     thisSeconds = 0 + offsetStartSeconds
    #     firstSeconds = totalSeconds
    #
    # m, s = divmod(thisSeconds, 60)
    # h, m = divmod(m, 60)
    # print "%d:%02d:%02d" % (h, m, s) + " - " + csv_row[0 + arrayOffset].strip() + " - " + csv_row[1 + arrayOffset].strip()
    # print "thisSeconds: " + str(thisSeconds)
    # print "this row: " + str(csv_row)

    if len(csv_row[4]) > 0:
        sampleList = csv_row[4].split(",")
    else:
        sampleList = csv_row[3].split(",")

    firstLoop = 1
    for sample in sampleList:
        if firstLoop == 1:
            sampleString = "7" + str(sample)
            firstLoop = 0
        else:
            sampleString = sampleString + "," + "7" + str(sample)

    print csv_row[0] + "|" + csv_row[1] + "|" + csv_row[2] + "|" + sampleString