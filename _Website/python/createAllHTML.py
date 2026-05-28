__author__ = 'Feist'
import csv
import shutil
from quik import FileLoader


class PhotographyItem(object):
    def __init__(self, sortnumber, timestamp, filename, photo_num, mag_number, mag_code, film_type, revolution_num,
                 principal_lat, principal_long, camera_tilt, camera_azimuth, alt_km, lens_mm, sun_elevation,
                 activity_name, description, photographer, date_taken):
        self.sortnumber = sortnumber
        self.timestamp = timestamp
        self.filename = filename
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
        return '{}: {} {} {} {} {} {} {} {} {} {} {} {} {} {} {} {} {}'.format(self.__class__.__name__,
                                                                               self.timestamp,
                                                                               self.filename,
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


def get_key(some_object):
    return some_object.sortnumber


def get_sec(s):
    l = s.split(':')
    if l[0][0:1] != "-":
        return int(l[0]) * 3600 + int(l[1]) * 60 + int(l[2])
    else:
        return int(l[0]) * 3600 + (int(l[1]) * 60 * -1) + (int(l[2]) * -1)


template_loader = FileLoader('./templates')

output_TOC_file_name_and_path = "../_webroot/17/TOC.html"
output_TOC_file = open(output_TOC_file_name_and_path, "w")
output_TOC_file.write("")
output_TOC_file.close()

output_TOC_file = open(output_TOC_file_name_and_path, "ab")

output_TOC_index_file_name_and_path = "../_webroot/17/indexes/TOCData.csv"
output_TOC_index_file = open(output_TOC_index_file_name_and_path, "w")
output_TOC_index_file.write("")
output_TOC_index_file.close()

output_TOC_index_file = open(output_TOC_index_file_name_and_path, "a")

# -------------------- Write TOC
# WRITE HEADER
template = template_loader.load_template('template_TOC_header.html')
output_TOC_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))

# WRITE TOC ITEMS
prev_depth = 0
timestamp = ""
inputFilePath = "../../MISSION_DATA/Mission TOC.csv"
csv.register_dialect('pipes', delimiter='|', doublequote=True, escapechar='\\')
reader = csv.reader(open(inputFilePath, "rU"), dialect='pipes')
for row in reader:
    timestamp = row[0]
    timeline_index_id = row[0].replace(":", "")
    item_depth = int(row[1])
    if item_depth == 3:
      item_depth = 2  # do this to avoid indentation of 3rd level items
    item_title = row[2]
    item_subtitle = row[3]
    item_URL = timestamp.replace(":", "")
    toc_index_id = timestamp.replace(":", "")
    template = template_loader.load_template('template_TOC_item.html')
    output_TOC_file.write(template.render(
      {'timestamp': timestamp, 
       'itemDepth': item_depth, 
       'prevDepth': prev_depth, 
       'itemTitle': item_title,
       'itemSubtitle': item_subtitle, 
       'itemURL': item_URL}
      , loader=template_loader).encode('utf-8'))
    prev_depth = item_depth
    output_TOC_index_file.write(timeline_index_id + "|" + str(item_depth) + "|" + item_title + "\n")

# WRITE FOOTER
template = template_loader.load_template('template_TOC_footer.html')
output_TOC_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))

# copy TOC index to webroot
# shutil.copyfile("../MISSION_DATA/Mission TOC.csv", "./_webroot/17/indexes/TOCData.csv")


# -------------------- Write Utterance Data
output_utterance_data_file_name_and_path = "../_webroot/17/indexes/utteranceData.csv"
output_utterance_data_file = open(output_utterance_data_file_name_and_path, "w")
output_utterance_data_file.write("")
output_utterance_data_file.close()
output_utterance_data_file = open(output_utterance_data_file_name_and_path, "a")

# WRITE ALL UTTERANCE BODY ITEMS
input_file_path = "../../MISSION_DATA/A17 master TEC and PAO utterances.csv"
utterance_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for utterance_row in utterance_reader:
  timeid = utterance_row[1].replace(":", "")
  if utterance_row[1] != "":  # if not a TAPE change or title row
    words_modified = utterance_row[3]
    who_modified = utterance_row[2]
    attribution_modified = utterance_row[0]

    output_utterance_data_file.write(timeid + "|" + who_modified + "|" + words_modified + "\n")


# WRITE ALL commentary ITEMS. There are three source files that need to be combined
output_commentary_data_file_name_and_path = "../_webroot/17/indexes/commentaryData.csv"
output_commentary_data_file = open(output_commentary_data_file_name_and_path, "w")
output_commentary_data_file.write("")
output_commentary_data_file.close()
output_commentary_data_file = open(output_commentary_data_file_name_and_path, "a")

commentaryMasterArray = []
input_file_path = "../../MISSION_DATA/commentaryALSJ.csv"
commentary_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for commentary_row in commentary_reader:
  edited_commentary_row = []
  edited_commentary_row.append(commentary_row[0].replace(":", "")) # timeid
  edited_commentary_row.append(commentary_row[1]) # attribution
  edited_commentary_row.append(commentary_row[2]) # who
  edited_commentary_row.append(commentary_row[3]) # words  
  commentaryMasterArray.append(edited_commentary_row)
  
input_file_path = "../../MISSION_DATA/commentaryALSJSummaryItems.csv"
commentary_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for commentary_row in commentary_reader:
  edited_commentary_row = []
  edited_commentary_row.append(commentary_row[0].replace(":", "")) # timeid
  edited_commentary_row.append(commentary_row[1]) # attribution
  edited_commentary_row.append(commentary_row[2]) # who
  edited_commentary_row.append(commentary_row[3]) # words  
  commentaryMasterArray.append(edited_commentary_row)

# AFJ commentary is not used. David Woods has not updated it on AFJ since it was provided to him by AiRT.
# input_file_path = "../../MISSION_DATA/commentaryAFJ.csv"
# commentary_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
# for commentary_row in commentary_reader:
#   edited_commentary_row = []
#   edited_commentary_row.append(commentary_row[0].replace(":", "")) # timeid
#   edited_commentary_row.append(commentary_row[1]) # attribution
#   edited_commentary_row.append(commentary_row[2]) # who
#   edited_commentary_row.append(commentary_row[3]) # words  
#   commentaryMasterArray.append(edited_commentary_row)
  
input_file_path = "../../MISSION_DATA/commentaryOtherSources.csv"
commentary_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for commentary_row in commentary_reader:
  edited_commentary_row = []
  edited_commentary_row.append(commentary_row[0].replace(":", "")) # timeid
  edited_commentary_row.append(commentary_row[1]) # attribution
  edited_commentary_row.append(commentary_row[2]) # who
  edited_commentary_row.append(commentary_row[3]) # words  
  commentaryMasterArray.append(edited_commentary_row)
  
  
# sort the commentaryMasterArray by timeid
commentaryMasterArray.sort(key=lambda x: x[0])

for commentary_row in commentaryMasterArray:  
  output_commentary_data_file.write(
    commentary_row[0] + "|" + commentary_row[1] + "|" + commentary_row[2] + "|" + commentary_row[3] + "\n")
output_commentary_data_file.close()


# --------------------------------- Write photo index
output_photo_index_file_name_and_path = "../_webroot/17/indexes/photoData.csv"
output_photo_index_file = open(output_photo_index_file_name_and_path, "w")
output_photo_index_file.write("")
output_photo_index_file.close()

output_photo_index_file = open(output_photo_index_file_name_and_path, "a")

master_list = []
input_file_path = "../../MISSION_DATA/photos.csv"
photos_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
first_row = True
for photo_row in photos_reader:
    if photo_row[0] != "" and photo_row[
        0] != "skip" and first_row is False:  # if timestamp not blank and photo not marked to skip
        if len(photo_row[1]) == 5:
            photo_filename = photo_row[2] + "-" + photo_row[1]  # + ".jpg"
        else:
            photo_filename = photo_row[1]  # + ".jpg"
        tempObj = PhotographyItem(get_sec(photo_row[0]), photo_row[0], photo_filename, photo_row[1], photo_row[2],
                                  photo_row[3], photo_row[4], photo_row[5], photo_row[6], photo_row[7], photo_row[8],
                                  photo_row[9], photo_row[10], photo_row[11], photo_row[12], photo_row[13],
                                  photo_row[14], photo_row[15], photo_row[16])
        master_list.append(tempObj)
    first_row = False

sorted_list = sorted(master_list, key=get_key, reverse=False)

for list_item in sorted_list:
    photo_index_id = list_item.timestamp.replace(":", "")
    output_photo_index_file.write(photo_index_id + "|" +
                                  list_item.filename + "|" +
                                  list_item.mag_code + "|" +
                                  list_item.photographer + "|" +
                                  list_item.description + "|" + "\n")
