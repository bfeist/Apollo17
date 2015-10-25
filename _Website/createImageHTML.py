__author__ = 'Feist'
import csv
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


def get_sec(s):
    l = s.split(':')
    if l[0][0:1] != "-":
        return int(l[0]) * 3600 + int(l[1]) * 60 + int(l[2])
    else:
        return int(l[0]) * 3600 + (int(l[1]) * 60 * -1) + (int(l[2]) * -1)


def get_key(some_object):
    return some_object.sortnumber


master_list = []
input_file_path = "../MISSION_DATA/photos.csv"
photos_reader = csv.reader(open(input_file_path, "rU"), delimiter='|')
first_row = True
for photo_row in photos_reader:
    if photo_row[0] != "" and photo_row[0] != "skip" and first_row is False: #if timestamp not blank
        if len(photo_row[1]) == 5:
            photo_filename = photo_row[2] + "-" + photo_row[1] + ".jpg"
        else:
            photo_filename = photo_row[1] + ".jpg"
        tempObj = PhotographyItem(get_sec(photo_row[0]), photo_row[0], photo_filename, photo_row[1], photo_row[2],
                                  photo_row[3], photo_row[4], photo_row[5], photo_row[6], photo_row[7], photo_row[8],
                                  photo_row[9], photo_row[10], photo_row[11], photo_row[12], photo_row[13],
                                  photo_row[14], photo_row[15], photo_row[16])
        master_list.append(tempObj)
    first_row = False

sorted_list = sorted(master_list, key=get_key, reverse=False)

for i, photo_object in enumerate(sorted_list):
    ##--------------------------------- Write photo page
    template_loader = FileLoader('templates')
    output_photo_index_file_name_and_path = "./_webroot/mission_images/meta/" + photo_object.filename + ".html"
    # output_photo_index_file = open(output_photo_index_file_name_and_path, "w")
    # output_photo_index_file.write("")


    output_photo_index_file = open(output_photo_index_file_name_and_path, "w")
    item_template = template_loader.load_template('template_photo_page.html')
    output_photo_index_file.write(item_template.render({'timestamp': photo_object.timestamp,
                                                        'photo_num': photo_object.photo_num,
                                                        'mag_code': photo_object.mag_code,
                                                        'mag_number': photo_object.mag_number,
                                                        'photographer': photo_object.photographer,
                                                        'description': photo_object.description,
                                                        'filename': photo_object.filename},loader=template_loader))
    output_photo_index_file.close()
