__author__ = 'Feist'
import csv
import fileinput
from quik import FileLoader

output_file_name_and_path = "./output/output_singlepage.html"
outputFile = open(output_file_name_and_path, "w")

# for curFile in [ "A17 master TEC and PAO manual merge.csv" ]:
for curFile in ["temp.csv"]:
    inputFilePath = "E:\Apollo17WIP\Processing_Output\\" + curFile
    reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
    for row in reader:
        if row[1] != "":
            loader = FileLoader('templates/tests')
            template = loader.load_template('transcriptTemplate_singlepage.html')
            outputFile.write(template.render({'datarow': row},
                                 loader=loader).encode('utf-8'))

outputFile.close()