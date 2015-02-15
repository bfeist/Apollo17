__author__ = 'Feist'
import csv
from quik import FileLoader

output_file_name_and_path = "./output/output.html"
outputFile = open(output_file_name_and_path, "w")
outputFile.write("")
outputFile.close()

outputFile = open(output_file_name_and_path, "a")

loader = FileLoader('templates')
#WRITE HEADER
template = loader.load_template('template_header.html')
outputFile.write(template.render({'datarow': 0},
            loader=loader).encode('utf-8'))

#WRITE BODY ITEMS
curRow = 0
inputFilePath = "E:\Apollo17.org\MISSION_DATA\A17 master TEC and PAO utterances.csv"
reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
for row in reader:
    curRow += 1
    if row[1] != "": #if not a TAPE change or title row
        loader = FileLoader('templates')
        template = loader.load_template('template_timelineitem.html')
        outputFile.write(template.render({'timestamp': row[1], 'who': row[2], 'words': row[3]}, loader=loader).encode('utf-8'))
    #if curRow > 1000:
    #    break

#WRITE FOOTER
template = loader.load_template('template_footer.html')
outputFile.write(template.render({'datarow': 0}, loader=loader).encode('utf-8'))
