__author__ = 'Feist'
import requests
import re

# urlArray = ["79155"]
urlArray = ["70030", "76015", "76010", "70011", "79010", "73010", "79002", "76001", "79001", "77010", "72010", "70012", "70017", "70215", "76055", "77035", "79035", "70050", "70051", "70052", "70053", "70054"]
# urlArray = ["a17.eva3post.html"]

for url in urlArray:
    page = requests.get('https://curator.jsc.nasa.gov/lunar/samplecatalog/sampleinfo.cfm?sample=' + url)
    pageAscii = page.text.encode('ascii', 'ignore')
    lines = pageAscii.split('\r')

    images = ''
    firstimage = True
    for line in lines:
        image_match = re.search(r'Photo Number: .*<br />Sample:', line)
        if image_match:
            image_name = line[image_match.start()+14:image_match.end()-13].lower()
            if firstimage:
                outputFilePath = "../_webroot/indexes/geosampledetails/" + url + ".csv"
                outputFile = open(outputFilePath, "w")
                outputFile.write("")
                outputFile.close()
                outputFile = open(outputFilePath, "a")
                images = image_name
                firstimage = False
            else:
                images = images + "|" + image_name

            #print 'Image found:', image_name
        else:
            pass

    print "************* DONE page:", url
    if not firstimage:
        outputFile.write(images)
        outputFile.close()


#
# __author__ = 'Feist'
# import requests
# import re
#
# urlArray = ["79155"]
#
# # urlArray = ["a17.eva3post.html"]
#
# outputFilePath = "../../MISSION_DATA/geoSampleDetails.csv"
# outputFile = open(outputFilePath, "w")
# outputFile.write("")
# outputFile.close()
# outputFile = open(outputFilePath, "a")
#
# for url in urlArray:
#     page = requests.get('https://curator.jsc.nasa.gov/lunar/samplecatalog/sampleinfo.cfm?sample=' + url)
#     pageAscii = page.text.encode('ascii', 'ignore')
#     lines = pageAscii.split('\r')
#
#     for line in lines:
#         image_match = re.search(r'Photo Number: .*<br />Sample:', line)
#         if image_match:
#             image_name = line[image_match.start()+14:image_match.end()-13].lower()
#             print 'Image found:', image_name
#         else:
#             pass
#
#
#     print "************* DONE page:", url