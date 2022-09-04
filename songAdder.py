from pytube import YouTube
import json
import random

URL = input("Type in the YouTube URL")

video = YouTube(URL)

with open('./songchoice.json') as f:
    data = json.load(f)


def generateRandNum():
    randNum = random.randint(0, 100000)
    if video.title.split()[0] + str(randNum) + ".mp4" not in data:
        return randNum
    else:
        return generateRandNum()


randNum = generateRandNum()
print("Downloading ", video.length, " seconds of ", video.title)
audio = video.streams.filter(only_audio=True)
audio[0].download("./assets/audio", video.title.split()
                  [0] + str(randNum) + ".mp4")
title = input("Type a custom title or type 'y' to use given YouTube title")

if title == "y":
    title = video.title

song = {title: video.title.split()
        [0] + str(randNum) + ".mp4"}

data.update(song)

with open('./songchoice.json', 'w') as f:
    json.dump(data, f, sort_keys=True)

print("Song added!")
