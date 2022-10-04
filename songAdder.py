from pytube import YouTube
import json
import random

URL = input("Type in the YouTube URL")

video = YouTube(URL)

with open('./songchoice.json') as f:
    data = json.load(f)

title = input("Type a custom title or type 'y' to use given YouTube title")

if title == "y":
    title = video.title

print("Downloading ", video.length, " seconds of ", video.title)
audio = video.streams.filter(only_audio=True)
audio[0].download("./assets/audio", title + ".mp4")


song = {title: title + ".mp4"}

data.update(song)

with open('./songchoice.json', 'w') as f:
    json.dump(data, f, sort_keys=True)

print("Song added!")
