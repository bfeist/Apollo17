import csv
import sys 
    
pageCounter = 0

reader = csv.reader(open("test2.csv", "rU"), delimiter='|')
for row in reader:
    #print(row)
    if row[0].startswith("Tape") or row[5].startswith("Tape"):
    #if new page
        if row[0].startswith("Tape"):
            tapeNumber = row[0]
        if row[5].startswith("Tape") :
            tapeNumber = row[5]
            
        pageCounter += 1
        print "\n\t{0}\n\tPage {1}".format(tapeNumber, pageCounter)
    elif row == ['', '', '', '', '', '', '']:
        pass
        #print "-----------------------blank row"
    elif row[4] == '' or row[4] == 'APOLLO':
        pass
    elif row[0] == '':
        print '{0} {1}'.format(row[4],row[5]) 
    else:
        print '{0} {1} {2} {3} {4} {5}'.format(row[0],row[1],row[2],row[3],row[4],row[5]) 
    