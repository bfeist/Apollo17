#!/usr/bin/env python
""" Script to scrape images from a flickr account.
Author: Ralph Bean <rbean@redhat.com>
"""

#flickr apollo17 api key: 325124824b39ace0aec161b1a313e025

import ConfigParser
import urllib
import requests
import os.path

# Get config secrets from a file
#config = ConfigParser.ConfigParser()
#config.read(['flickr.ini', '/etc/flickr.ini'])
#flickr_api_key = config.get('general', 'flickr_api_key')

flickr_api_key = "325124824b39ace0aec161b1a313e025"

# API urls
flickr_url = 'https://api.flickr.com/services/rest/'


def flickr_request(**kwargs):
    response = requests.get(flickr_url, params=dict(
        api_key=flickr_api_key,
        format='json',
        nojsoncallback=1,
        **kwargs))
    return response.json()


#------------ get all photos using person method:
def get_flickr_page(nsid, page=1):
    return flickr_request(
        method='flickr.people.getPhotos',
        user_id=nsid,
        content_type=1,  # photos only
        page=page
    )

def get_photos_for_person(nsid):
    pages = get_flickr_page(nsid)['photos']['pages']

    seen = {}
    # Step backwards through the pictures
    for page in range(pages, 1, -1):
        d = get_flickr_page(nsid, page=page)
        for photo in d['photos']['photo']:
            yield photo


#------------ get all photos using photoset method:

def get_photo_sets_per_person(nsid):
    return flickr_request(
        method='flickr.photosets.getList',
        user_id=nsid,
        per_page="500"
    )

def get_photos_per_set(nsid, photoset_id):
    return flickr_request(
        method='flickr.photosets.getPhotos',
        user_id=nsid,
        photoset_id=photoset_id,
        per_page="500"
    )

def get_photos_for_person_via_sets(nsid):
    photo_sets = get_photo_sets_per_person(nsid)['photosets']
    for photoset in photo_sets['photoset']:
        photoset_id = photoset['id']
        d = get_photos_per_set(nsid, photoset_id=photoset_id)
        for photo in d['photoset']['photo']:
            yield photo

#-------------- get original URL

def get_flickr_photo_info(photoid):
    return flickr_request(
        method='flickr.photos.getSizes',
        photo_id=photoid
    )

def get_flickr_photo_origurl(photoid):
    orig_url = ""
    sizes = get_flickr_photo_info(photoid)
    label_template = "{label}"
    source_template = "{source}"
    for size in sizes['sizes']['size']:
        if label_template.format(**size) == "Original":
            orig_url = source_template.format(**size)
    return orig_url



def main():

    #nsid = raw_input("NSID of the flickr user you want to scrape: ")
    #nsid = "projectapolloarchive"
    nsid = "136485307@N06"

    # First get all photos
    # https://secure.flickr.com/services/api/flickr.people.getPhotos.html

    #photos = get_photos_for_person(nsid)
    photos = get_photos_for_person_via_sets(nsid)

    print "Got photo list. Downloading non-duplicates..."

    # Then, with photo objects, get the images
    # https://secure.flickr.com/services/api/misc.urls.html
    # Each of these photo objects looks something like this
    # {u'farm': 8,
    #  u'id': u'13606821584',
    #  u'isfamily': 0,
    #  u'isfriend': 0,
    #  u'ispublic': 1,
    #  u'owner': u'65490292@N04',
    #  u'secret': u'c5bfa5eb3e',
    #  u'server': u'7171',
    #  u'title': u''}

    output = 'flickr/'
    prefix = "http://farm{farm}.staticflickr.com/{server}/"
    suffix = "{id}_{secret}_b.jpg"
    title_template = "{title}"
    id_template = "{id}"
    template = prefix + suffix

    for i, photo in enumerate(photos):
        url = template.format(**photo)
        filename = title_template.format(**photo) + ".jpg"
        filename = filename.replace("\"", "")
        folder_name = filename[:4]
        if not os.path.isdir(output + folder_name + "/"):
            local = output + filename
        else:
            local = output + folder_name + "/" + filename

        if not os.path.isfile(local):
            # print "Already exists. Skipping ", local
        # else:
            orig_url = get_flickr_photo_origurl(id_template.format(**photo))
            if orig_url != "":
                url = orig_url
            print "* saving", url
            urllib.urlretrieve(url, local)
            print "      as", local


if __name__ == '__main__':
    main()