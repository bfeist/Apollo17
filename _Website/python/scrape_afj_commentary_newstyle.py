__author__ = 'Feist'
import requests
import re


def cleanseString(str):
    result = re.sub('<a name=".*"></a>', '', str)
    result = re.sub(' +', ' ', result).strip()
    return result


urlArray = ["01_day01_launch.html",
"02_day01_earth_orbit_tli.html",
"03_day01_tde.html",
"04_day01_human_weathersat.html",
"05_day02_part1.html",
"06_day02_part2_earthwatching.html",
"07_day03_part1_mcc2.html",
"08_day03_part2_enter_lm.html",
"09_day04_part1_clock_update.html",
"10_day04_part2_light_flash.html",
"11_day05_part1_approach_moon.html",
"12_day05_part2_loi.html",
"13_day05_part3_doi.html",
"14_day05_part4.html",
"15_day06_part1.html",
"16_day06_part2_landing_prep.html",
"17_day06_part3_solo_ops1.html",
"18_day07_solo_ops2.html",
"19_day08_solo_ops3.html",
"20_day09_solo_ops4.html",]

# urlArray = ["01launch_ascent.html"]

outputFilePath = "../../MISSION_DATA/commentaryAFJ.csv"
outputFile = open(outputFilePath, "w")
outputFile.write("")
outputFile.close()
outputFile = open(outputFilePath, "a")

for url in urlArray:
    request = requests.get('https://history.nasa.gov/afj/ap17fj/' + url)
    pageAscii = request.text.encode('ascii', 'ignore').decode('ascii')
    lines = pageAscii.split("\r\n")

    timestamp = ''
    commentary = ''
    linecounter = 0
    commentary_multiline_started = False

    for line in lines:
        linecounter += 1
        if linecounter == 667:
            print('test area')
        timestamp_match = re.search(r'<b>(\d{3}:\d{2}:\d{2})', line)
        if timestamp_match is not None:
            timestamp = timestamp_match.group(1)
            # timestamp = timestamp[0:3] + ":" + timestamp[3:5] + ":" + timestamp[5:7]

        timestamp_match = re.search(r'a name="(-\d{7})"', line)
        if timestamp_match is not None:
            timestamp = timestamp_match.group(1)
            timestamp = "-" + timestamp[2:4] + ":" + timestamp[4:6] + ":" + timestamp[6:8]

        if commentary_multiline_started:
            commentary_closing_match = re.search(r'(.*)</div>', line)
            if commentary_closing_match is not None:
                commentary += commentary_closing_match.group(1).strip() + " "
                commentary_multiline_started = False
                commentary = cleanseString(commentary)
                print(str(linecounter) + " GET: " + timestamp + " Commentary: " + commentary)
                outputFile.write(timestamp + "|" + commentary + "\n")
                commentary = ''
            else:
                commentary += line.strip() + " "

        commentary_match = re.search(r'<div class="comment">(.*)', line)
        if commentary_match is not None:
            commentary_single_line_match = re.search(r'<div class="comment">(.*)</div>', line)
            if commentary_single_line_match is not None:
                if 'omm break.' not in commentary_single_line_match.group(1):
                    commentary = commentary_single_line_match.group(1).strip()
                    commentary = cleanseString(commentary)
                    print(str(linecounter) + " GET: " + timestamp + " Commentary: " + commentary)
                    outputFile.write(timestamp + "|" + commentary + "\n")
                    commentary = ''
            else:
                commentary_multiline_started = True
                commentary += commentary_match.group(1).strip() + " "

    print("************* DONE page:", url)
outputFile.close()
