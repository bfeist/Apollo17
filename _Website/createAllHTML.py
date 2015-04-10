__author__ = 'Feist'
import csv
from quik import FileLoader

output_TOC_file_name_and_path = "./_webroot/TOC.html"
output_TOC_file = open(output_TOC_file_name_and_path, "w")
output_TOC_file.write("")
output_TOC_file.close()

output_TOC_file = open(output_TOC_file_name_and_path, "a")

output_TOC_index_file_name_and_path = "./_webroot/TOCindex.csv"
output_TOC_index_file = open(output_TOC_index_file_name_and_path, "w")
output_TOC_index_file.write("")
output_TOC_index_file.close()

output_TOC_index_file = open(output_TOC_index_file_name_and_path, "a")

## ---------------- Write TOC
template_loader = FileLoader('templates')
#WRITE HEADER
template = template_loader.load_template('template_TOC_header.html')
output_TOC_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))

#WRITE TOC ITEMS
prev_depth = 0
timestamp = ""
inputFilePath = "../MISSION_DATA/Mission TOC.csv"
csv.register_dialect('pipes', delimiter='|', doublequote=True, escapechar='\\')
reader = csv.reader(open(inputFilePath, "rU"), dialect='pipes')
for row in reader:
    timestamp = row[0]
    item_depth = row[1]
    item_title = row[2]
    item_subtitle = row[3]
    #item_URL = timestamp.translate(None, ":") + "_" + item_title.translate(None, ":/ .") + ".html"
    item_URL = "timeid" + timestamp.translate(None, ":")
    toc_index_id = timestamp.translate(None, ":")
    loader = FileLoader('templates')
    template = loader.load_template('template_TOC_item.html')
    output_TOC_file.write(template.render({'timestamp': timestamp, 'itemDepth': item_depth, 'prevDepth': prev_depth, 'itemTitle': item_title, 'itemSubtitle': item_subtitle, 'itemURL': item_URL}, loader=loader).encode('utf-8'))
    prev_depth = item_depth
    toc_index_template = loader.load_template('template_TOC_index.html')
    output_TOC_index_file.write(toc_index_template.render({'toc_index_id': toc_index_id}, loader=loader).encode('utf-8'))

#WRITE FOOTER
template = template_loader.load_template('template_TOC_footer.html')
output_TOC_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))


## -------------------- Write Utterance HTML
output_utterance_file_name_and_path = "./_webroot/allUtterances.html"
output_utterance_file = open(output_utterance_file_name_and_path, "w")
output_utterance_file.write("")
output_utterance_file.close()

output_utterance_file = open(output_utterance_file_name_and_path, "a")

output_utterance_index_file_name_and_path = "./_webroot/utteranceIndex.csv"
output_utterance_index_file = open(output_utterance_index_file_name_and_path, "w")
output_utterance_index_file.write("")
output_utterance_index_file.close()

output_utterance_index_file = open(output_utterance_index_file_name_and_path, "a")

#WRITE HEADER
template = template_loader.load_template('template_header.html')
output_utterance_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))

#WRITE ALL UTTERANCE BODY ITEMS
cur_row = 0
input_file_path = "../MISSION_DATA/A17 master TEC and PAO utterances.csv"
utterance_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for utterance_row in utterance_reader:
    cur_row += 1
    timeid = "timeid" + utterance_row[1].translate(None, ":")
    timeline_index_id = utterance_row[1].translate(None, ":")
    if utterance_row[1] != "": #if not a TAPE change or title row
        words_modified = utterance_row[3].replace("O2", "O<sub>2</sub>")
        words_modified = words_modified.replace("H2", "H<sub>2</sub>")
        who_modified = utterance_row[2].replace("CDR", "Cernan")
        who_modified = who_modified.replace("CMP", "Evans")
        who_modified = who_modified.replace("LMP", "Schmitt")
        attribution_modified = utterance_row[0]

        template = template_loader.load_template('template_timelineitem.html')
        output_utterance_file.write(template.render({'timeid': timeid, 'timestamp': utterance_row[1], 'who': who_modified, 'words': words_modified, 'attribution': attribution_modified}, loader=template_loader))

        timeline_index_template = loader.load_template('template_timeline_index.html')
        output_utterance_index_file.write(timeline_index_template.render({'timeline_index_id': timeline_index_id}, loader=loader).encode('utf-8'))

#WRITE FOOTER
template = template_loader.load_template('template_footer.html')
output_utterance_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))


#--------------------------------- Write commentary HTML
output_commentary_file_name_and_path = "./_webroot/commentary.html"
output_commentary_file = open(output_commentary_file_name_and_path, "w")
output_commentary_file.write("")
output_commentary_file.close()

output_commentary_file = open(output_commentary_file_name_and_path, "a")

output_commentary_index_file_name_and_path = "./_webroot/commentaryIndex.csv"
output_commentary_index_file = open(output_commentary_index_file_name_and_path, "w")
output_commentary_index_file.write("")
output_commentary_index_file.close()

output_commentary_index_file = open(output_commentary_index_file_name_and_path, "a")

#WRITE commentary HEADER
template = template_loader.load_template('template_commentary_header.html')
output_commentary_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))

#WRITE ALL commentary BODY ITEMS
cur_row = 0
input_file_path = "../MISSION_DATA/A17 master support commentary.csv"
commentary_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for commentary_row in commentary_reader:
    cur_row += 1
    timeid = "timeid" + commentary_row[1].translate(None, ":")
    commentary_index_id = commentary_row[1].translate(None, ":")
    if commentary_row[1] != "": #if not a TAPE change or title row
        words_modified = commentary_row[3].replace("O2", "O<sub>2</sub>")
        words_modified = words_modified.replace("H2", "H<sub>2</sub>")
        attribution_modified = commentary_row[0]

        template = template_loader.load_template('template_commentary_item.html')
        output_commentary_file.write(template.render({'timeid': timeid, 'timestamp': commentary_row[1], 'who': commentary_row[2], 'words': words_modified, 'attribution': attribution_modified}, loader=template_loader))

        commentary_index_template = template_loader.load_template('template_commentary_index.html')
        output_commentary_index_file.write(commentary_index_template.render({'commentary_index_id': commentary_index_id}, loader=template_loader).encode('utf-8'))

#WRITE commentary FOOTER
template = template_loader.load_template('template_commentary_footer.html')
output_commentary_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))

output_commentary_index_file_name_and_path = "./_webroot/commentaryIndex.csv"
output_commentary_index_file = open(output_commentary_index_file_name_and_path, "w")
output_commentary_index_file.write("")
output_commentary_index_file.close()

output_commentary_index_file = open(output_commentary_index_file_name_and_path, "a")

##--------------------------------- Write photo index
output_photo_index_file_name_and_path = "./_webroot/photoIndex.csv"
output_photo_index_file = open(output_photo_index_file_name_and_path, "w")
output_photo_index_file.write("")
output_photo_index_file.close()

output_photo_index_file = open(output_photo_index_file_name_and_path, "a")

#WRITE ALL photo index
input_file_path = "../MISSION_DATA/photos.csv"
photo_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for photo_row in photo_reader:
    photo_index_id = photo_row[0].translate(None, ":")
    if photo_row[0] != "": #if photo has a timestamp
        template = template_loader.load_template('template_photo_index.html')
        output_photo_index_file.write(template.render({'photo_index_id': photo_index_id}, loader=template_loader).encode('utf-8'))

#WRITE commentary FOOTER
template = template_loader.load_template('template_commentary_footer.html')
output_commentary_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))