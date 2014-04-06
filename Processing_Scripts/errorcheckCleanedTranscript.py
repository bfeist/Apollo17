import csv
import sys 
import re

class PrevTimestamp:
	def __init__(self, line, intTimestamp, strTimestamp):
		self.line = line
		self.intTimestamp = intTimestamp
		self.strTimestamp = strTimestamp

curRow = 0
prevTimestamp = 0
strippedTimestamp = ""
missingAudioFlag = 0
prevRowTimestamps = []
numPrevTimestampsToTrack = 6

#init prevTimestamps array
tsObj = PrevTimestamp(0,0,"")
for _ in range(0, numPrevTimestampsToTrack):	
	prevRowTimestamps.append(tsObj)

for curFile in [ "A17 master TEC and PAO manual merge.csv" ]:
	inputFilePath = "E:\Apollo17WIP\Processing_Output\\" + curFile
	reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
	for row in reader:
		curRow += 1
		if row[1].__len__() > 9:
			print curRow
			print "------------- timestamp too long: " + row[1]
		
		strippedTimestamp = row[1].translate(None, ":") #remove colons
		if strippedTimestamp != "" and int(strippedTimestamp) > 0 : #don't analyze tape change lines (blank timestamp) or pre-launch segment
			if int(strippedTimestamp) < prevRowTimestamps[0].intTimestamp:
				print "Timestamp order error on line: " + str(curRow)
			
			#update the list of the previous x timecodes
			prevRowTimestamps.insert(0 , PrevTimestamp(curRow, int(strippedTimestamp), row[1]))
			del prevRowTimestamps[numPrevTimestampsToTrack] #delete the previously last element in the list
			
			#analyze last 4 timecodes as a check for missing audio (repeated timecodes exist on missing audio segments)
			similarLinesCount = 0
			for i in range(0, numPrevTimestampsToTrack - 1):
				#print "i: " + str(i) + " : " + str(prevRowTimestamps[i].line)
				if prevRowTimestamps[i].intTimestamp == prevRowTimestamps[i+1].intTimestamp:
					similarLinesCount += 1
			if similarLinesCount >= numPrevTimestampsToTrack - 1: # last x lines are the same, missing audio
				if missingAudioFlag == 0:
					print "Missing audio starts line: " + str(prevRowTimestamps[numPrevTimestampsToTrack - 1].line) + " : " + prevRowTimestamps[numPrevTimestampsToTrack - 1].strTimestamp
				missingAudioFlag = 1
			elif similarLinesCount == 0: # last x lines are all different from each other, missing audio must have ended
				if missingAudioFlag == 1:
					print "Missing audio ends   line: " + str(prevRowTimestamps[numPrevTimestampsToTrack - 2].line) + " : " + prevRowTimestamps[numPrevTimestampsToTrack - 2].strTimestamp
				missingAudioFlag = 0

		#if curRow > 10000:
		#	break
print "DONE"