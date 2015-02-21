__author__ = 'Feist'
import csv
from quik import FileLoader

output_file_name_and_path = "./output/output.html"
outputFile = open(output_file_name_and_path, "w")
outputFile.write("")
outputFile.close()

outputFile = open(output_file_name_and_path, "a")

template_loader = FileLoader('templates')

#WRITE HEADER
item_template = template_loader.load_template('template_header.html')
outputFile.write(item_template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))

#WRITE SEGMENT BODY ITEMS
cur_row = 0
input_file_path = "E:\Apollo17.org\MISSION_DATA\A17 master TEC and PAO utterances.csv"
utterance_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for utterance_row in utterance_reader:
    cur_row += 1
    timeid = "timeid" + utterance_row[1].translate(None, ":")
    if utterance_row[1] != "": #if not a TAPE change or title row
        item_template = template_loader.load_template('template_timelineitem.html')
        outputFile.write(item_template.render({'timeid': timeid, 'timestamp': utterance_row[1], 'who': utterance_row[2], 'words': utterance_row[3]}, loader=template_loader).encode('utf-8'))


#WRITE FOOTER
item_template = template_loader.load_template('template_footer.html')
outputFile.write(item_template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))
