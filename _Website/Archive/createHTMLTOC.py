__author__ = 'Feist'
import csv
from quik import FileLoader

output_file_name_and_path = "./output/TOCtest.html"
outputFile = open(output_file_name_and_path, "w")
outputFile.write("")
outputFile.close()

outputFile = open(output_file_name_and_path, "a")

loader = FileLoader('templates')
#WRITE HEADER
template = loader.load_template('template_TOC_header.html')
outputFile.write(template.render({'datarow': 0},
            loader=loader).encode('utf-8'))

#WRITE BODY ITEMS
prevDepth = 0
inputFilePath = "E:\Apollo17.org\MISSION_DATA\Mission TOC.csv"
reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
for row in reader:
    timestamp = row[0]
    itemDepth = row[1]
    itemTitle = row[2]
    itemSubtitle = row[3]
    loader = FileLoader('templates')
    template = loader.load_template('template_TOC_item.html')
    outputFile.write(template.render({'timestamp': timestamp, 'itemDepth': itemDepth, 'prevDepth': prevDepth, 'itemTitle': itemTitle, 'itemSubtitle': itemSubtitle},
                             loader=loader).encode('utf-8'))
    prevDepth = itemDepth

#WRITE FOOTER
template = loader.load_template('template_TOC_footer.html')
outputFile.write(template.render({'datarow': 0},
            loader=loader).encode('utf-8'))
