__author__ = 'Feist'
import requests
import re

urlArray = ["a17.landing.html", "a17.postland.html", "a17.eva1prep.html", "a17.1ststep.html", "a17.lrvdep.html", "a17.lrvload.html", "a17.alsepoff.html", "a17.alsepdep.html", "a17.deepcore.html", "a17.trvsta1.html", "a17.sta1.html", "a17.trvlm1.html", "a17.clsout1.html", "a17.eva1post.html", "a17.eva2wake.html", "a17.eva2prep.html", "a17.outcam.html", "a17.trvsta2.html", "a17.sta2.html", "a17.trvsta3.html", "a17.trvsta4.html", "a17.sta4.html", "a17.trvsta5.html", "a17.sta5.html", "a17.clsout2.html", "a17.eva2post.html", "a17.eva3prep.html", "a17.trvsta6.html", "a17.sta6.html", "a17.sta7.html", "a17.sta8.html", "a17.trvsta9.html", "a17.sta9.html", "a17.trvlm3.html", "a17.clsout3.html", "a17.eva3post.html", "a17.launch.html"]

# urlArray = ["a17.eva3post.html"]

outputFilePath = "../../MISSION_DATA/commentaryALSJ.csv"
outputFile = open(outputFilePath, "w")
outputFile.write("")
outputFile.close()
outputFile = open(outputFilePath, "a")

for url in urlArray:
    page = requests.get('http://www.hq.nasa.gov/alsj/a17/' + url)
    pageAscii = page.text.encode('ascii', 'ignore')
    lines = pageAscii.split('\r')
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
            commentary = commentary.replace('target="new"', 'target="alsj"')
            commentary = commentary.replace('&quot;', '"')

            whoMatch = re.match('Cernan|Schmitt|Evans', commentary)
            # source = 'Eric Jones, <a href="http://www.hq.nasa.gov/alsj/a17/a17.html" target="alsj">ALSJ</a>'
            source = 'Eric Jones, ALSJ'
            if whoMatch:
                commentary = commentary[whoMatch.end() + 1 : len(commentary) - 1]
                if "Cernan" in whoMatch.group():
                    who = "Cernan"
                    source = "ALSJ"
                elif "Schmitt" in whoMatch.group():
                    who = "Schmitt"
                    source = "ALSJ"
                elif "Evans" in whoMatch.group():
                    who = "Evans"
                    source = "ALSJ"

            print 'commentary found:', timestamp, '|', who, '|', commentary
            outputFile.write(timestamp + "|" + source + "|" + who + "|" + commentary + "\n")
        else:
            pass

    print "************* DONE page:", url
