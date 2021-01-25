__author__ = 'Feist'
import requests
import re
from time import sleep

# urlArray = ["79155"]
urlArray = [70001, 70002, 70003, 70004, 70005, 70006, 70007, 70008, 70009, 70010, 70011, 70012, 70017, 70018, 70019, 70030, 70035, 70040, 70050, 70051, 70052, 70053, 70054, 70060, 70061, 70062, 70063, 70064, 70070, 70075, 70130, 70135, 70136, 70137, 70138, 70139, 70145, 70146, 70147, 70148, 70149, 70155, 70156, 70157, 70160, 70161, 70162, 70163, 70164, 70165, 70170, 70175, 70180, 70181, 70182, 70183, 70184, 70185, 70215, 70250, 70251, 70252, 70253, 70254, 70255, 70256, 70270, 70271, 70272, 70273, 70274, 70275, 70290, 70295, 70310, 70311, 70312, 70313, 70314, 70315, 70320, 70321, 70322, 70323, 70324, 71010, 71030, 71035, 71036, 71037, 71040, 71041, 71042, 71043, 71044, 71045, 71046, 71047, 71048, 71049, 71050, 71055, 71060, 71061, 71062, 71063, 71064, 71065, 71066, 71067, 71068, 71069, 71075, 71085, 71086, 71087, 71088, 71089, 71095, 71096, 71097, 71130, 71131, 71132, 71133, 71134, 71135, 71136, 71150, 71151, 71152, 71153, 71154, 71155, 71156, 71157, 71170, 71175, 71500, 71501, 71502, 71503, 71504, 71505, 71506, 71507, 71508, 71509, 71515, 71520, 71525, 71526, 71527, 71528, 71529, 71530, 71535, 71536, 71537, 71538, 71539, 71545, 71546, 71547, 71548, 71549, 71555, 71556, 71557, 71558, 71559, 71565, 71566, 71567, 71568, 71569, 71575, 71576, 71577, 71578, 71579, 71585, 71586, 71587, 71588, 71589, 71595, 71596, 71597, 72010, 72130, 72131, 72132, 72133, 72134, 72135, 72140, 72141, 72142, 72143, 72144, 72145, 72150, 72155, 72160, 72161, 72162, 72163, 72164, 72210, 72215, 72220, 72221, 72222, 72223, 72224, 72230, 72235, 72240, 72241, 72242, 72243, 72244, 72250, 72255, 72260, 72261, 72262, 72263, 72264, 72270, 72275, 72310, 72315, 72320, 72321, 72322, 72323, 72324, 72330, 72335, 72350, 72355, 72370, 72375, 72390, 72395, 72410, 72415, 72416, 72417, 72418, 72430, 72431, 72432, 72433, 72434, 72435, 72440, 72441, 72442, 72443, 72444, 72460, 72461, 72462, 72463, 72464, 72500, 72501, 72502, 72503, 72504, 72505, 72530, 72535, 72536, 72537, 72538, 72539, 72545, 72546, 72547, 72548, 72549, 72555, 72556, 72557, 72558, 72559, 72700, 72701, 72702, 72703, 72704, 72705, 72730, 72735, 72736, 72737, 72738, 73001, 73002, 73010, 73120, 73121, 73122, 73123, 73124, 73130, 73131, 73132, 73133, 73134, 73140, 73141, 73142, 73143, 73144, 73145, 73146, 73150, 73151, 73152, 73153, 73154, 73155, 73156, 73210, 73211, 73212, 73213, 73214, 73215, 73216, 73217, 73218, 73219, 73220, 73221, 73222, 73223, 73224, 73225, 73230, 73235, 73240, 73241, 73242, 73243, 73244, 73245, 73250, 73255, 73260, 73261, 73262, 73263, 73264, 73270, 73275, 73280, 73281, 73282, 73283, 73284, 73285, 74001, 74002, 74010, 74110, 74111, 74112, 74113, 74114, 74115, 74116, 74117, 74118, 74119, 74120, 74121, 74122, 74123, 74124, 74220, 74221, 74222, 74223, 74224, 74230, 74235, 74240, 74241, 74242, 74243, 74244, 74245, 74246, 74247, 74248, 74249, 74250, 74255, 74260, 74261, 74262, 74263, 74264, 74265, 74270, 74275, 74285, 74286, 74287, 75010, 75015, 75030, 75035, 75050, 75055, 75060, 75061, 75062, 75063, 75064, 75065, 75066, 75070, 75075, 75080, 75081, 75082, 75083, 75084, 75085, 75086, 75087, 75088, 75089, 75110, 75111, 75112, 75113, 75114, 75115, 75120, 75121, 75122, 75123, 75124, 76001, 76010, 76015, 76030, 76031, 76032, 76033, 76034, 76035, 76036, 76037, 76055, 76120, 76121, 76122, 76123, 76124, 76130, 76131, 76132, 76133, 76134, 76135, 76136, 76137, 76210, 76215, 76220, 76221, 76222, 76223, 76224, 76230, 76235, 76236, 76237, 76238, 76239, 76240, 76241, 76242, 76243, 76244, 76245, 76246, 76250, 76255, 76260, 76261, 76262, 76263, 76264, 76265, 76270, 76275, 76280, 76281, 76282, 76283, 76284, 76285, 76286, 76290, 76295, 76305, 76306, 76307, 76310, 76315, 76320, 76321, 76322, 76323, 76324, 76330, 76335, 76500, 76501, 76502, 76503, 76504, 76505, 76506, 76530, 76535, 76536, 76537, 76538, 76539, 76545, 76546, 76547, 76548, 76549, 76555, 76556, 76557, 76558, 76559, 76565, 76566, 76567, 76568, 76569, 76575, 76576, 76577, 77010, 77017, 77035, 77070, 77075, 77076, 77077, 77110, 77115, 77130, 77135, 77210, 77215, 77510, 77511, 77512, 77513, 77514, 77515, 77516, 77517, 77518, 77519, 77525, 77526, 77530, 77531, 77532, 77533, 77534, 77535, 77536, 77537, 77538, 77539, 77545, 78120, 78121, 78122, 78123, 78124, 78130, 78135, 78150, 78155, 78220, 78221, 78222, 78223, 78224, 78230, 78231, 78232, 78233, 78234, 78235, 78236, 78237, 78238, 78250, 78255, 78256, 78420, 78421, 78422, 78423, 78424, 78440, 78441, 78442, 78443, 78444, 78460, 78461, 78462, 78463, 78464, 78465, 78480, 78481, 78482, 78483, 78484, 78500, 78501, 78502, 78503, 78504, 78505, 78506, 78507, 78508, 78509, 78515, 78516, 78517, 78518, 78525, 78526, 78527, 78528, 78530, 78535, 78536, 78537, 78538, 78539, 78545, 78546, 78547, 78548, 78549, 78555, 78556, 78557, 78558, 78559, 78565, 78566, 78567, 78568, 78569, 78575, 78576, 78577, 78578, 78579, 78585, 78586, 78587, 78588, 78589, 78595, 78596, 78597, 78598, 78599, 79001, 79002, 79010, 79035, 79110, 79115, 79120, 79121, 79122, 79123, 79124, 79125, 79130, 79135, 79150, 79155, 79170, 79175, 79190, 79195, 79210, 79215, 79220, 79221, 79222, 79223, 79224, 79225, 79226, 79227, 79228, 79240, 79241, 79242, 79243, 79244, 79245, 79260, 79261, 79262, 79263, 79264, 79265, 79510, 79511, 79512, 79513, 79514, 79515, 79516, 79517, 79518, 79519, 79525, 79526, 79527, 79528, 79529, 79535, 79536, 79537]

# urlArray = ["a17.eva3post.html"]

for url in urlArray:
    sleep(0.5) #throttle hits on the server somewhat
    page = requests.get('https://curator.jsc.nasa.gov/lunar/samplecatalog/sampleinfo.cfm?sample=' + str(url))
    pageAscii = page.text.encode('ascii', 'ignore')
    lines = pageAscii.split('\r')

    images = ''
    firstimage = True
    for line in lines:
        image_match = re.search(r'photoinfo.cfm\?photo=(.*)" title=', line)
        if image_match:
            image_name = image_match.group(1).lower()
            if firstimage:
                outputFilePath = "../_webroot/17/indexes/geosampledetails/" + str(url) + ".csv"
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
