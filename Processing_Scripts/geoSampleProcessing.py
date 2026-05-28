__author__ = 'Feist'
import csv

input_file_path = "../../MISSION_DATA/geoData.csv"
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

    rangeSplit = csv_row[3].split("-")
    rangeItemized = ""
    if len(rangeSplit) == 2:
        # print "range detected: " + str(rangeSplit)
        if rangeSplit[0].isdigit() and rangeSplit[1].isdigit():
            firstloop = 1
            for counter in range(int(rangeSplit[0]), int(rangeSplit[1]) + 1):
                if firstloop == 1:
                    rangeItemized = str(counter)
                else:
                    rangeItemized = rangeItemized + "," + str(counter)
                firstloop = 0
            # print rangeItemized

    print csv_row[0] + "|" + csv_row[1] + "|" + csv_row[2] + "|" + csv_row[3] + "|" + rangeItemized

