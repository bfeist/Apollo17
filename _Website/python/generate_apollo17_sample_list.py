import re

qbfile = open("17page.html", "r") # make this file by saving the source of the 17 search results on the curation website

sampleString = ''
for line in qbfile:
    match = re.search(r'sampleinfo.cfm\?sample=(.*)" target=', line)
    if match:
        sample_num = match.group(1)
        sampleString = sampleString + ", " + sample_num
    else:
        pass

print sampleString