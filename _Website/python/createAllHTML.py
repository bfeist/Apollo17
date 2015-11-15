__author__ = 'Feist'
import csv
import shutil
from quik import FileLoader


class PhotographyItem(object):
	def __init__(self, sortnumber, timestamp, filename, photo_num, mag_number, mag_code, film_type, revolution_num, principal_lat, principal_long, camera_tilt, camera_azimuth, alt_km, lens_mm, sun_elevation, activity_name, description, photographer, date_taken):
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

template_loader = FileLoader('../templates')

output_TOC_file_name_and_path = "../_webroot/TOC.html"
output_TOC_file = open(output_TOC_file_name_and_path, "w")
output_TOC_file.write("")
output_TOC_file.close()

output_TOC_file = open(output_TOC_file_name_and_path, "a")

output_TOC_index_file_name_and_path = "../_webroot/indexes/TOCall.csv"
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
	item_depth = row[1]
	if item_depth == "3":
		item_depth = "2" # do this to avoid indentation of 3rd level items
	item_title = row[2]
	item_subtitle = row[3]
	# item_URL = timestamp.translate(None, ":") + "_" + item_title.translate(None, ":/ .") + ".html"
	item_URL = timestamp.translate(None, ":")
	toc_index_id = timestamp.translate(None, ":")
	template = template_loader.load_template('template_TOC_item.html')
	output_TOC_file.write(template.render({'timestamp': timestamp, 'itemDepth': item_depth, 'prevDepth': prev_depth, 'itemTitle': item_title, 'itemSubtitle': item_subtitle, 'itemURL': item_URL}, loader=template_loader).encode('utf-8'))
	prev_depth = item_depth
	# toc_index_template = loader.load_template('template_TOC_index.html')
	# output_TOC_index_file.write(toc_index_template.render({'toc_index_id': toc_index_id, 'itemDepth': item_depth, 'itemTitle': item_title}, loader=loader).encode('utf-8'))

	output_TOC_index_file.write(timestamp + "|" + item_depth + "|" + item_title + "|" + item_subtitle + "\n")

# WRITE FOOTER
template = template_loader.load_template('template_TOC_footer.html')
output_TOC_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))

# copy TOC index to webroot
# shutil.copyfile("../MISSION_DATA/Mission TOC.csv", "./_webroot/indexes/TOCall.csv")


# -------------------- Write Utterance Data
output_utterance_data_file_name_and_path = "../_webroot/indexes/utteranceData.csv"
output_utterance_data_file = open(output_utterance_data_file_name_and_path, "w")
output_utterance_data_file.write("")
output_utterance_data_file.close()
output_utterance_data_file = open(output_utterance_data_file_name_and_path, "a")

# WRITE ALL UTTERANCE BODY ITEMS
cur_row = 0
input_file_path = "../../MISSION_DATA/A17 master TEC and PAO utterances.csv"
utterance_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for utterance_row in utterance_reader:
	cur_row += 1
	timeid = "timeid" + utterance_row[1].translate(None, ":")
	timeline_index_id = utterance_row[1].translate(None, ":")
	if utterance_row[1] != "": #if not a TAPE change or title row
		words_modified = utterance_row[3]
		# words_modified = words_modified.replace("O2", "O<sub>2</sub>")
		# words_modified = words_modified.replace("H2", "H<sub>2</sub>")
		# words_modified = words_modified.replace("Tig ", "T<sub>ig</sub> ")
		who_modified = utterance_row[2]
		# who_modified = who_modified.replace("CDR", "Cernan")
		# who_modified = who_modified.replace("CMP", "Evans")
		# who_modified = who_modified.replace("LMP", "Schmitt")
		# who_modified = who_modified.replace("PAO", "Public Affairs")
		# who_modified = who_modified.replace("CC", "Mission Control")
		attribution_modified = utterance_row[0]

		output_utterance_data_file.write(timeline_index_id + "|" + who_modified + "|" + words_modified + "\n")

# --------------------------------- Write commentary HTML
output_commentary_file_name_and_path = "../_webroot/commentary.html"
output_commentary_file = open(output_commentary_file_name_and_path, "w")
output_commentary_file.write("")
output_commentary_file.close()

output_commentary_file = open(output_commentary_file_name_and_path, "a")

output_commentary_index_file_name_and_path = "../_webroot/indexes/commentaryIndex.csv"
output_commentary_index_file = open(output_commentary_index_file_name_and_path, "w")
output_commentary_index_file.write("")
output_commentary_index_file.close()

output_commentary_index_file = open(output_commentary_index_file_name_and_path, "a")

# WRITE commentary HEADER
template = template_loader.load_template('template_commentary_header.html')
output_commentary_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))

# WRITE ALL commentary BODY ITEMS
cur_row = 0
input_file_path = "../../MISSION_DATA/A17 master support commentary.csv"
commentary_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
for commentary_row in commentary_reader:
	cur_row += 1
	comid = commentary_row[0].translate(None, ":")
	commentary_index_id = commentary_row[0].translate(None, ":")
	if commentary_row[0] != "": #if not a TAPE change or title row
		words_modified = commentary_row[3].replace("O2", "O<sub>2</sub>")
		words_modified = words_modified.replace("H2", "H<sub>2</sub>")
		attribution_modified = commentary_row[1]

		template = template_loader.load_template('template_commentary_item.html')
		output_commentary_file.write(template.render({'comid': comid, 'timestamp': commentary_row[0], 'who': commentary_row[2], 'words': words_modified, 'attribution': attribution_modified}, loader=template_loader))

		commentary_index_template = template_loader.load_template('template_commentary_index.html')
		output_commentary_index_file.write(commentary_index_template.render({'commentary_index_id': commentary_index_id}, loader=template_loader).encode('utf-8'))

# WRITE commentary FOOTER
template = template_loader.load_template('template_commentary_footer.html')
output_commentary_file.write(template.render({'datarow': 0}, loader=template_loader).encode('utf-8'))


# --------------------------------- Write photo index
output_photo_index_file_name_and_path = "../_webroot/indexes/photoIndex.csv"
output_photo_index_file = open(output_photo_index_file_name_and_path, "w")
output_photo_index_file.write("")
output_photo_index_file.close()

output_photo_index_file = open(output_photo_index_file_name_and_path, "a")

master_list = []
input_file_path = "../../MISSION_DATA/photos.csv"
photos_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
first_row = True
for photo_row in photos_reader:
	if photo_row[0] != "" and photo_row[0] != "skip" and first_row is False: #if timestamp not blank and photo not marked to skip
		if len(photo_row[1]) == 5:
			photo_filename = photo_row[2] + "-" + photo_row[1] # + ".jpg"
		else:
			photo_filename = photo_row[1] # + ".jpg"
		tempObj = PhotographyItem(get_sec(photo_row[0]), photo_row[0], photo_filename, photo_row[1], photo_row[2],
								  photo_row[3], photo_row[4], photo_row[5], photo_row[6], photo_row[7], photo_row[8],
								  photo_row[9], photo_row[10], photo_row[11], photo_row[12], photo_row[13], photo_row[14], photo_row[15], photo_row[16])
		master_list.append(tempObj)
	first_row = False

sorted_list = sorted(master_list, key=get_key, reverse=False)

for list_item in sorted_list:
	photo_index_id = list_item.timestamp.translate(None, ":")
	output_photo_index_file.write(photo_index_id + "|" +
								  list_item.filename + "|" +
								  list_item.photo_num + "|" +
								  list_item.mag_code + "|" +
								  list_item.mag_number + "|" +
								  list_item.photographer + "|" +
								  list_item.description + "|" + "\n")