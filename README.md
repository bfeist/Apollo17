This is a project to reconstruct the Apollo 17 mission timeline in order to generate digital, corrected transcripts of the entire mission. From these transcripts I hope to create an interactive web experience of the entire mission.

Website on this effort: http://benfeist.com/project-apollo-17/

Original post on this project: https://groups.google.com/forum/?fromgroups#!topic/spacelog/H7D4UiLfhPo

Feel free to contact me if you're interested in this project or the output.
Ben Feist (bf@benfeist.com)


"MISSION_DATA" folder: The main source of authoritive transcript information that is the product of this project can be found in "A17 master TEC and PAO utterances.csv"

"! Previous Steps" folder contains files that were used for each step of the transcript digitization. The steps were:
<ol>
	<li>Convert source images (complete)</li>
	<li>OCR Tecnical Air-to-ground (TEC) transcript into dirty CSV tables (complete)</li>
	<li>OCR Public Affairs Office (PAO) transcript into dirty CSV tables (complete)</li>
	<li>Process CSV OCR output with Python scripts (multiple one-time operations to clean various issues) (complete) (more here http://benfeist.com/digitizing-apollo-17-part-5-python-processing/ )</li>
	<li>Reconstruct entire mission timeline in Adobe Premiere laying in air-to-ground audio from Internet Archive and television video from NASA History office. (complete - pending last 5% of source material digitized by JSC Audio Lab). (more here http://benfeist.com/digitizing-apollo-17-part-6-timeline-reconstruction/ )</li>
	<li>Listen to reconstruction timeline. Correct transcript of each utterance including timestamp, transcriptions errors from 1972, and OCR errors. (complete) (more here http://benfeist.com/digitizing-apollo-17-part-7-listening-in-real-time/ )</li>
	<li>Render all Premiere Pro video segments that were created for timecode purposes, and upload all 39, 8 hour segments (125GB) to YouTube. YouTube Channel containing these videos: https://www.youtube.com/channel/UC3pGYbJCfrINT1DNBJMxC2Q/videos
	<li>Generate HTML transcript from corrected utterance CSV. (complete)</li>
</ol>
Current Status:
<ul>
	<li>http://apollo17.org is live</li>
</ul>
Future Steps:
<ul>
	<li>Generate HTML for AFJ</li>
	<li>Generate MC output for Spacelog.org</li>
</ul>

The "_Website/_webroot" folder contains the apollo17.org website itself.

The "! Previous Steps/OCR/Abbyy Image OCR" folder contains a project that can be opened using ABBYY FineReader 11 Pro. This is where the body of the conversion work is being done.

The "! Previous Steps/OCR/OCR_Output" folder contains pipe-delimited CSV files that are direct outputs from FineReader. These CSV files are quite dirty, as many as 100 pages were completely misread by finereader due to the typing being tilted in the scans.

The "Processing_Scripts" folder contains Python scripts that were written to scrub the OCR CSV output. These scripts are changed often to assist with whatever portion of the cleaning process is currently being addressed. They perform tasks such as timestamp processing, checking of callsigns, merging dialog lines that are split across pages in the typewritten originals, etc.

The "_MC_Output" folder contains the output from scripts like makeTEC_MCFromRawCSV.py in the "Processing_Scripts" folder. This "MC" output is a format that's usable by Spacelog.org.

The "_AFJ" folder contains the output of all transcript data into HTML compatible with the Apollo Flight Journal.