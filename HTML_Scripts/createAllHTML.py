__author__ = 'Feist'
import csv
from quik import FileLoader

def write_segment_file(timestamp_start, timestamp_end, segment_filename, segment_title, segment_subtitle):
    template_loader = FileLoader('templates')
    timestamp_start_int = int(timestamp_start.translate(None, ":"))
    timestamp_end_int = int(timestamp_end.translate(None, ":"))

    output_segment_file_name_and_path = "./output/segments/" + segment_filename
    output_segment_file = open(output_segment_file_name_and_path, "w")
    output_segment_file.write("")
    output_segment_file.close()

    output_segment_file = open(output_segment_file_name_and_path, "a")
    #write file for current segment
    #WRITE SEGMENT HEADER
    item_template = template_loader.load_template('template_header.html')
    output_segment_file.write(item_template.render({'title': segment_title, 'subtitle': segment_subtitle},loader=template_loader).encode('utf-8'))

    #WRITE SEGMENT BODY ITEMS
    cur_row = 0
    input_file_path = "E:\Apollo17.org\MISSION_DATA\A17 master TEC and PAO utterances.csv"
    utterance_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
    for utterance_row in utterance_reader:
        cur_row += 1
        timeid = "timeid" + utterance_row[1].translate(None, ":")
        if utterance_row[1] != "": #if not a TAPE change or title row
            if (int(utterance_row[1].translate(None, ":")) >= timestamp_start_int) & (int(utterance_row[1].translate(None, ":")) < timestamp_end_int):
                item_template = template_loader.load_template('template_timelineitem.html')
                output_segment_file.write(item_template.render({'timeid': timeid, 'timestamp': utterance_row[1], 'who': utterance_row[2], 'words': utterance_row[3]}, loader=template_loader).encode('utf-8'))
            elif int(utterance_row[1].translate(None, ":")) > timestamp_end_int :
                break
        #if cur_row > 100:
        #    break

    #WRITE SEGMENT FOOTER
    item_template = loader.load_template('template_footer.html')
    output_segment_file.write(item_template.render({'datarow': 0}, loader=loader).encode('utf-8'))

output_file_name_and_path = "./output/TOC.html"
output_TOC_file = open(output_file_name_and_path, "w")
output_TOC_file.write("")
output_TOC_file.close()

output_TOC_file = open(output_file_name_and_path, "a")

loader = FileLoader('templates')
#WRITE HEADER
template = loader.load_template('template_TOC_header.html')
output_TOC_file.write(template.render({'datarow': 0}, loader=loader).encode('utf-8'))

#WRITE TOC ITEMS AND EACH PAGE FILE
prev_depth = 0
prev_timestamp = ""
prev_title = ""
prev_subtitle = ""
inputFilePath = "E:\Apollo17.org\MISSION_DATA\Mission TOC.csv"
reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
for row in reader:
    timestamp = row[0]
    item_depth = row[1]
    item_title = row[2]
    item_subtitle = row[3]
    item_URL = timestamp.translate(None, ":") + "_" + item_title.translate(None, ":/ .") + ".html"
    loader = FileLoader('templates')
    template = loader.load_template('template_TOC_item.html')
    output_TOC_file.write(template.render({'timestamp': timestamp, 'itemDepth': item_depth, 'prevDepth': prev_depth, 'itemTitle': item_title, 'itemSubtitle': item_subtitle, 'itemURL': item_URL}, loader=loader).encode('utf-8'))

    if prev_timestamp != "": #write output file for time range from previous TOC item to current item, and give it the name of the previous TOC item
        output_segment_file_name = prev_timestamp.translate(None, ":") + "_" + prev_title.translate(None, ":/ .") + ".html"
        write_segment_file(prev_timestamp, timestamp, output_segment_file_name, prev_title, prev_subtitle)

    prev_depth = item_depth
    prev_timestamp = timestamp
    prev_title = item_title
    prev_subtitle = item_subtitle

#WRITE FOOTER
template = loader.load_template('template_TOC_footer.html')
output_TOC_file.write(template.render({'datarow': 0}, loader=loader).encode('utf-8'))
