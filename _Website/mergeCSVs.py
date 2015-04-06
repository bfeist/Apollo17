__author__ = 'Feist'
import csv
import operator


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

sorted_list = sorted(master_list, key=get_key, reverse=False)

for list_item in sorted_list:
    print list_item
    # print type(list_item) is TranscriptItem
    # print "timestamp: " + list_item[1]
    # print "attribution: " + list_item[2]
    # print "who: " + list_item[3]
    # print "words: " + list_item[4]
    # print "\n"