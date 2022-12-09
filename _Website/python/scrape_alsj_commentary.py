__author__ = 'Feist'
import requests
import re
from os.path import exists

urlArray = ["a17.landing.html", "a17.postland.html", "a17.eva1prep.html", "a17.1ststep.html", "a17.lrvdep.html", "a17.lrvload.html", "a17.alsepoff.html", "a17.alsepdep.html", "a17.deepcore.html", "a17.trvsta1.html", "a17.sta1.html", "a17.trvlm1.html", "a17.clsout1.html", "a17.eva1post.html", "a17.eva2wake.html", "a17.eva2prep.html", "a17.outcam.html", "a17.trvsta2.html", "a17.sta2.html", "a17.trvsta3.html", "a17.trvsta4.html", "a17.sta4.html", "a17.trvsta5.html", "a17.sta5.html", "a17.clsout2.html", "a17.eva2post.html", "a17.eva3prep.html", "a17.trvsta6.html", "a17.sta6.html", "a17.sta7.html", "a17.sta8.html", "a17.trvsta9.html", "a17.sta9.html", "a17.trvlm3.html", "a17.clsout3.html", "a17.eva3post.html", "a17.launch.html"]

# urlArray = ["a17.eva3post.html"]

outputFilePath = "../../MISSION_DATA/commentaryALSJ.csv"
outputCachePath = "../../MISSION_DATA/alsjCache/"

commentaryArray = []
for url in urlArray:    
  if exists(outputCachePath + url):
    page = open(outputCachePath + url, "r", encoding="utf-8", newline='\r\n')
    pageContent = page.read()
  else:
    page = requests.get('http://www.hq.nasa.gov/alsj/a17/' + url)
    pageContent = page.content.decode("utf-8", "replace")
    # write to cache
    cacheFile = open(outputCachePath + url, "w", encoding="utf-8")
    cacheFile.write(pageContent)
    
  # pageAscii = page.text.encode('ascii', 'ignore')
  lines = pageContent.split('\r')
  timestamp = ''
  gCommentaryStarted = False
  gCommentaryEnded = False
  gConcatenatedLine = ''
  for line in lines:
    timestamp_match = re.search(r'<b>.\d\d:\d\d:\d\d</b>', line)
    if timestamp_match:
      timestamp = line[timestamp_match.start()+3:timestamp_match.end()-4]
      # print 'Timestamp found:', timestamp
    else:
      pass

    commentarySegment = ''
    # commentaryCompleteMatch = re.search(r'\[.*\]', line)
    # if commentaryCompleteMatch:
    #     gCommentaryStarted = True
    #     gCommentaryEnded = True
    #     commentarySegment = line[commentaryCompleteMatch.start() + 1 : commentaryCompleteMatch.end() - 1] # remove square brackets
    # else:

    commentaryStartMatch = re.search(r'\[', line)
    if commentaryStartMatch:
      gCommentaryStarted = True
      gConcatenatedLine = ''

    commentaryEndMatch = re.search(r'\]', line)
    if commentaryEndMatch:
      gCommentaryEnded = True
      commentarySegment = line[:commentaryEndMatch.end() - 1]

    if gCommentaryStarted and not gCommentaryEnded:
      commentarySegment = line + ' '

    commentarySegment = commentarySegment.replace('<blockquote><i>', '')
    commentarySegment = commentarySegment.replace('  ', ' ')
    commentarySegment = commentarySegment.replace('[', '')
    commentarySegment = commentarySegment.replace(']', '')
    commentarySegment = commentarySegment.replace('\n', ' ')
        
    commentarySegment = commentarySegment.strip()
    gConcatenatedLine = gConcatenatedLine + commentarySegment

    if gCommentaryStarted & gCommentaryEnded:
      gCommentaryStarted = False
      gCommentaryEnded = False
      commentary = gConcatenatedLine
      gConcatenatedLine = ''
      who = ''
      urlMatch = re.search(r'<a href=".*"', commentary)
      if urlMatch:
        if commentary[urlMatch.start()+9:urlMatch.start()+11] == "..":
          commentary = commentary.replace('<a href="../', '<a href="http://www.hq.nasa.gov/alsj/')
        elif commentary[urlMatch.start()+9:urlMatch.start()+13] == "http":
          pass
        else:
          commentary = commentary.replace('<a href="', '<a href="http://www.hq.nasa.gov/alsj/a17/')
      
      commentary = commentary.replace('<a href="http://www.hq.nasa.gov/alsj', '@alsjurl')
      commentary = commentary.replace(' target="new"', '@alsjt')
      
      commentary = commentary.replace(' title="image"', '')
      commentary = commentary.replace(' title="image detail"', '')
      commentary = commentary.replace('&quot;', '"')
      commentary = commentary.replace('- "', '')
      commentary = commentary.replace('-"', '')
      commentary = commentary.replace('Very Long Comm Break.', '')
      commentary = commentary.replace('Very Long Comm Break', '')
      commentary = commentary.replace('Long Comm Break.', '')
      commentary = commentary.replace('Long Comm Break', '')
      commentary = commentary.replace('Comm Break.', '')
      commentary = commentary.replace('Comm Break', '')
      commentary = commentary.replace('; static.', '')
      commentary = commentary.replace('; static', '')
      commentary = commentary.replace('(continuing) ', '')
      commentary = commentary.strip()
      

      whoMatch = re.match('Cernan|Schmitt|Evans', commentary)
      # source = 'Eric Jones, <a href="http://www.hq.nasa.gov/alsj/a17/a17.html" target="alsj">ALSJ</a>'
      source = 'ALSJ'
      if whoMatch:
        commentary = commentary[whoMatch.end() + 1 : len(commentary) - 1]
        if "Cernan" in whoMatch.group():
          who = "CDR"
          source = "ALSJ"
        elif "Schmitt" in whoMatch.group():
          who = "LMP"
          source = "ALSJ"
        elif "Evans" in whoMatch.group():
          who = "CMP"
          source = "ALSJ"

      # print ('commentary found:', timestamp, '|', who, '|', commentary)
      if commentary != '':
        commentaryArray.append(timestamp + "|" + source + "|" + who + "|" + commentary)        
      else:
        pass
  print ("************* DONE page:", url)

# loop through commentaryArray. if commentary is in quotes, then attribute it to the previous speaker
for i in range(0, len(commentaryArray)):
  commentaryArrayItem = commentaryArray[i]
  commentaryDict = commentaryArrayItem.split('|')
  if commentaryDict[3].startswith('"') and commentaryDict[3].endswith('"'):    
    commentaryArray[i] = commentaryDict[0] + "|" + commentaryDict[1] + "|" + previousWho + "|" + commentaryDict[3].strip('\"')
  else:
    previousWho = commentaryDict[2]

outputFile = open(outputFilePath, "w")
outputFile.write("")
outputFile.close()
outputFile = open(outputFilePath, "a", encoding="utf-8")
for commentary in commentaryArray:
  outputFile.write(commentary + "\n")
