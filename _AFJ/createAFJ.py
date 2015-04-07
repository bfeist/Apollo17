__author__ = 'Feist'
import csv
from quik import FileLoader

def get_sec(s):
    l = s.split(':')
    if l[0][0:1] != "-":
        return int(l[0]) * 3600 + int(l[1]) * 60 + int(l[2])
    else:
        return int(l[0]) * 3600 + (int(l[1]) * 60 * -1) + (int(l[2]) * -1)


def get_key(some_object):
    return some_object.sortnumber


class TranscriptItem(object):
    def __init__(self, sortnumber, timestamp, who, words):
        self.sortnumber = sortnumber
        self.timestamp = timestamp
        self.who = who
        self.words = words

    def __repr__(self):
        return '{}: {} {} {}'.format(self.__class__.__name__,
                                     self.timestamp,
                                     self.who,
                                     self.words)


class CommentaryItem(object):
    def __init__(self, sortnumber, timestamp, attribution, who, words):
        self.sortnumber = sortnumber
        self.timestamp = timestamp
        self.attribution = attribution
        self.who = who
        self.words = words

    def __repr__(self):
        return '{}: {} *{}* {} {}'.format(self.__class__.__name__,
                                          self.timestamp,
                                          self.attribution,
                                          self.who,
                                          self.words)


class PhotographyItem(object):
    def __init__(self, sortnumber, timestamp, photo_num, mag_number, mag_code, film_type, revolution_num, principal_lat, principal_long, camera_tilt, camera_azimuth, alt_km, lens_mm, sun_elevation, activity_name, description, photographer, date_taken):
        self.sortnumber = sortnumber
        self.timestamp = timestamp
        self.photo_num = photo_num
        self.mag_number = mag_number
        self.mag_code = mag_code
        self.film_type = film_type
        self.revolution_num = revolution_num
        self.principal_lat = principal_lat
        self.principal_long = principal_long
        self.camera_tilt = camera_tilt
        self.camera_azimuth = camera_azimuth
        self.alt_km = alt_km
        self.lens_mm = lens_mm
        self.sun_elevation = sun_elevation
        self.activity_name = activity_name
        self.description = description
        self.photographer = photographer
        self.date_taken = date_taken

    def __repr__(self):
        return '{}: {} {} {} {} {} {} {} {} {} {} {} {} {} {} {} {}'.format(self.__class__.__name__,
                                                                            self.timestamp,
                                                                            self.photo_num,
                                                                            self.mag_number,
                                                                            self.mag_code,
                                                                            self.film_type,
                                                                            self.revolution_num,
                                                                            self.principal_lat,
                                                                            self.principal_long,
                                                                            self.camera_tilt,
                                                                            self.camera_azimuth,
                                                                            self.alt_km,
                                                                            self.lens_mm,
                                                                            self.sun_elevation,
                                                                            self.activity_name,
                                                                            self.description,
                                                                            self.photographer,
                                                                            self.date_taken)


def get_combined_transcript_list():
    master_list = []
    # format: sortorder, timestamp, attribution, who, words
    input_file_path = "../MISSION_DATA/temp_utterances.csv"
    utterance_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
    for utterance_row in utterance_reader:
        if utterance_row[1] != "": #if not a TAPE change or title row
            tempObj = TranscriptItem(get_sec(utterance_row[1]), utterance_row[1], utterance_row[2], utterance_row[3])
            master_list.append(tempObj)

    input_file_path = "../MISSION_DATA/A17 master support commentary.csv"
    commentary_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
    for commentary_row in commentary_reader:
        tempObj = CommentaryItem(get_sec(commentary_row[1]), commentary_row[1], commentary_row[0], commentary_row[2], commentary_row[3])
        master_list.append(tempObj)

    input_file_path = "../MISSION_DATA/photos.csv"
    photos_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
    first_row = True
    for photo_row in photos_reader:
        if photo_row[0] != "" and first_row is False: #if timestamp not blank
            tempObj = PhotographyItem(get_sec(photo_row[0]), photo_row[0], photo_row[1], photo_row[2], photo_row[3], photo_row[4], photo_row[5], photo_row[6], photo_row[7], photo_row[8], photo_row[9], photo_row[10], photo_row[11], photo_row[12], photo_row[13], photo_row[14], photo_row[15], photo_row[16])
            master_list.append(tempObj)
        first_row = False

    return sorted(master_list, key=get_key, reverse=False)


def write_segment_file(timestamp_start, timestamp_end, segment_filename, segment_title, segment_subtitle):
    template_loader = FileLoader('templates')
    timestamp_start_int = int(timestamp_start.translate(None, ":"))
    timestamp_end_int = int(timestamp_end.translate(None, ":"))

    output_segment_file_name_and_path = "./_webroot/segments/" + segment_filename
    output_segment_file = open(output_segment_file_name_and_path, "w")
    output_segment_file.write("")
    output_segment_file.close()

    output_segment_file = open(output_segment_file_name_and_path, "a")
    #write file for current segment
    #WRITE SEGMENT HEADER
    item_template = template_loader.load_template('template_afj_header.html')
    output_segment_file.write(item_template.render({'title': segment_title, 'subtitle': segment_subtitle},loader=template_loader))

    #WRITE SEGMENT BODY ITEMS
    cur_row = 0
    # input_file_path = "../MISSION_DATA/A17 master TEC and PAO utterances.csv"
    # utterance_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
    combined_list = get_combined_transcript_list()

    for combined_list_item in combined_list:
        cur_row += 1
        timeid = "timeid" + combined_list_item.timestamp.translate(None, ":")
        if combined_list_item.timestamp != "": #if not a TAPE change or title row
            if (int(combined_list_item.timestamp.translate(None, ":")) >= timestamp_start_int) & (int(combined_list_item.timestamp.translate(None, ":")) < timestamp_end_int):
                if type(combined_list_item) is TranscriptItem:
                    words_modified = combined_list_item.words.replace("O2", "O<sub>2</sub>")
                    words_modified = words_modified.replace("H2", "H<sub>2</sub>")
                    who_modified = combined_list_item.who.replace("CDR", "Cernan")
                    who_modified = who_modified.replace("CMP", "Evans")
                    who_modified = who_modified.replace("LMP", "Schmitt")
                    item_template = template_loader.load_template('template_afj_item_utterance.html')
                    output_segment_file.write(item_template.render({'timeid': timeid, 'timestamp': combined_list_item.timestamp, 'who': who_modified, 'words': words_modified}, loader=template_loader))
                if type(combined_list_item) is CommentaryItem:
                    item_template = template_loader.load_template('template_afj_item_commentary.html')
                    output_segment_file.write(item_template.render({'who': combined_list_item.who, 'words': combined_list_item.words, 'attribution': combined_list_item.attribution}, loader=template_loader).encode('UTF-8'))
                if type(combined_list_item) is PhotographyItem:
                    item_template = template_loader.load_template('template_afj_item_photo.html')
                    output_segment_file.write(item_template.render({'description': combined_list_item.description, 'photo_num': combined_list_item.photo_num}, loader=template_loader))

            elif int(combined_list_item.timestamp.translate(None, ":")) > timestamp_end_int:
                break
                #if cur_row > 100:
                #    break

    #WRITE SEGMENT FOOTER
    item_template = loader.load_template('template_afj_footer.html')
    output_segment_file.write(item_template.render({'datarow': 0}, loader=loader).encode('utf-8'))

output_file_name_and_path = "./_webroot/TOC.html"
output_TOC_file = open(output_file_name_and_path, "w")
output_TOC_file.write("")
output_TOC_file.close()

output_TOC_file = open(output_file_name_and_path, "a")

loader = FileLoader('templates')
#WRITE HEADER
template = loader.load_template('template_afj_TOC_header.html')
output_TOC_file.write(template.render({'datarow': 0}, loader=loader).encode('utf-8'))

#WRITE TOC ITEMS AND EACH PAGE FILE
prev_depth = 0
prev_timestamp = ""
prev_title = ""
prev_subtitle = ""
inputFilePath = "../MISSION_DATA/Mission TOC.csv"
reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
for row in reader:
    timestamp = row[0]
    item_depth = row[1]
    item_title = row[2]
    item_subtitle = row[3]
    if item_depth == "1":
        item_URL = timestamp.translate(None, ":") + "_" + item_title.translate(None, ":/ .\"\\?") + ".html"
        loader = FileLoader('templates')
        template = loader.load_template('template_afj_TOC_item.html')
        output_TOC_file.write(template.render({'timestamp': timestamp, 'itemDepth': item_depth, 'prevDepth': prev_depth, 'itemTitle': item_title, 'itemSubtitle': item_subtitle, 'itemURL': item_URL}, loader=loader).encode('utf-8'))

        if prev_timestamp != "": #write output file for time range from previous TOC item to current item, and give it the name of the previous TOC item
            output_segment_file_name = prev_timestamp.translate(None, ":") + "_" + prev_title.translate(None, ":/ .\"\\?") + ".html"
            write_segment_file(prev_timestamp, timestamp, output_segment_file_name, prev_title, prev_subtitle)

        prev_depth = item_depth
        prev_timestamp = timestamp
        prev_title = item_title
        prev_subtitle = item_subtitle

#WRITE FOOTER
template = loader.load_template('template_afj_TOC_footer.html')
output_TOC_file.write(template.render({'datarow': 0}, loader=loader).encode('utf-8'))
