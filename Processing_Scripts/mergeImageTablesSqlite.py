#!/usr/bin/python
# -*- coding: utf-8 -*-

import sqlite3 as lite

def get_values_across_tables(search_photo_num, column_name):
    check_sql = "SELECT " + column_name + " FROM photos4 WHERE photo_num = \'" + search_photo_num + "\'"
    c = conn.cursor()
    result_string = None
    for r in c.execute(check_sql):
        result_string = r[0]

    if result_string is None:
        check_sql = "SELECT " + column_name + " FROM photos1 WHERE photo_num = \'" + search_photo_num + "\'"
        for r in c.execute(check_sql):
           result_string = r[0]

    if result_string is None:
       check_sql = "SELECT " + column_name + " FROM photos2 WHERE photo_num = \'" + search_photo_num + "\'"
       for r in c.execute(check_sql):
           result_string = r[0]

    if result_string is None:
        check_sql = "SELECT " + column_name + " FROM photos3 WHERE photo_num = \'" + search_photo_num + "\'"
        for r in c.execute(check_sql):
           result_string = r[0]

    # print check_sql
    return result_string

conn = lite.connect('E:\Apollo17.org\MISSION_DATA\photos.db')
conn.row_factory = lite.Row

print "Opened database successfully";

cursor = conn.cursor()
# get all photo numbers from all 4 photo tables
sql= 'SELECT DISTINCT photo_num from photos1 UNION SELECT DISTINCT photo_num from photos2 UNION SELECT DISTINCT photo_num from photos3 UNION SELECT DISTINCT photo_num from photos4 order by photo_num'

conn_insert = lite.connect('E:\Apollo17.org\MISSION_DATA\photos_merged.db')
insert_cursor = conn_insert.cursor()

for row in cursor.execute(sql):
    #print row
    photo_num = str(row['photo_num'])

    mag_number = get_values_across_tables(photo_num, "mag_number")
    if mag_number is None : mag_number = ''
    mag_code = get_values_across_tables(photo_num, "mag_code")
    if mag_code is None : mag_code = ''
    film_type = get_values_across_tables(photo_num, "film_type")
    if film_type is None : film_type = ''
    revolution_num = get_values_across_tables(photo_num, "revolution_num")
    if revolution_num is None : revolution_num = ''
    principal_lat = get_values_across_tables(photo_num, "principal_lat")
    if principal_lat is None : principal_lat = ''
    principal_long = get_values_across_tables(photo_num, "principal_long")
    if principal_long is None : principal_long = ''
    camera_tilt = get_values_across_tables(photo_num, "camera_tilt")
    if camera_tilt is None : camera_tilt = ''
    camera_azimuth = get_values_across_tables(photo_num, "camera_azimuth")
    if camera_azimuth is None : camera_azimuth = ''
    alt_km = get_values_across_tables(photo_num, "alt_km")
    if alt_km is None : alt_km = ''
    lens_mm = get_values_across_tables(photo_num, "lens_mm")
    if lens_mm is None : lens_mm = ''
    sun_elevation = get_values_across_tables(photo_num, "sun_elevation")
    if sun_elevation is None : sun_elevation = ''
    activity_name = get_values_across_tables(photo_num, "activity_name")
    if activity_name is None : activity_name = ''
    description = str(get_values_across_tables(photo_num, "description"))
    if description is None : description = ''
    description = str.replace(description, "'", "''")

    photographer = get_values_across_tables(photo_num, "photographer")
    if photographer is None : photographer = ''
    date_taken = get_values_across_tables(photo_num, "date_taken")
    if date_taken is None : date_taken = ''

    insert_sql = "INSERT INTO photos (photo_num, mag_number, mag_code, film_type, revolution_num, principal_lat, principal_long, camera_tilt, camera_azimuth, alt_km, lens_mm, sun_elevation, activity_name, description, photographer, date_taken) VALUES ('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')" % (photo_num, mag_number, mag_code, film_type, revolution_num, principal_lat, principal_long, camera_tilt, camera_azimuth, alt_km, lens_mm, sun_elevation, activity_name, description, photographer, date_taken)
    insert_cursor.execute(insert_sql)
    print photo_num + " || " + insert_sql

conn_insert.commit()
print "Operation done successfully";
conn.close()
conn_insert.close()