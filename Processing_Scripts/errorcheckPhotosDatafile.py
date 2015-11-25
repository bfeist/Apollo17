import csv
import os.path

curRow = 0

listTimestamps = []

print "Checking for dup timestamps..."
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

print "DONE Checking for dup timestamps"

print "Checking for missing jpgs..."
curRow = 0
for curFile in ["photoData.csv"]:
	inputFilePath = "../_Website/_webroot/indexes/" + curFile
	reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
	for row in reader:
		curRow += 1
		if row[3].__len__() > 0:
			path = "../_Website/_webroot/mission_images/flight/4175/"
			filename = "AS17-" + row[1] + ".jpg"
		else:
			path = "../_Website/_webroot/mission_images/supporting/2100/"
			filename = row[1] + ".jpg"

		if os.path.isfile(path + filename):
			# print "Photo exists:", filename
			pass
		else:
			print "Photo Missing:", filename

print "DONE Checking for missing jpgs"