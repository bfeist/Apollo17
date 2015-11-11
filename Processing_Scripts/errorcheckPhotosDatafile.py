import csv

curRow = 0

listTimestamps = []

for curFile in ["photos.csv"]:
	inputFilePath = "../MISSION_DATA/" + curFile
	reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
	for row in reader:
		curRow += 1
		if row[0].__len__() > 9:
			print curRow
			print "------------- timestamp too long: " + row[0]

		timestamp = row[0]

		if timestamp != "" and timestamp != "skip":
			if timestamp in listTimestamps:
				print "timestamp already used: " + row[0]
			else:
				listTimestamps.append(timestamp)

print "DONE"
