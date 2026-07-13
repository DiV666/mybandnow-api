@songInstrument
Feature: Get a song instrument by id
  In order to review a song arrangement
  I want to read a song instrument only when I belong to the song band

  Background:
    Given An "songId" parameter with value as "string":
    """
    $uuid
    """
    And An "anotherSongId" parameter with value as "string":
    """
    $uuid
    """
    And An "musicianId" parameter with value as "string":
    """
    $uuid
    """
    And An "instrumentId" parameter with value as "string":
    """
    $uuid
    """
    And An "videoId" parameter with value as "string":
    """
    $uuid
    """
    And An existing song with id "#songId" and musician "#musicianId"
    And An existing song with id "#anotherSongId" and musician "#musicianId"
    And A band membership exists for musician "#musicianId" in the song "#songId" band
    And A band membership exists for musician "#musicianId" in the song "#anotherSongId" band
    And An existing song instrument with id "#instrumentId" for song "#songId" and musician "#musicianId"

  Scenario: A band member gets the requested song instrument without a video
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a GET request to "/v1/songs/#songId/instruments/#instrumentId"
    Then the response status code should be 200
    And the response with ignored fields "createdAt" should be:
      """
      {
        "id": "#instrumentId",
        "name": "Lead Guitar",
        "instrumentType": "guitar",
        "songId": "#songId",
        "musicianId": "#musicianId",
        "video": null
      }
      """

  Scenario: A band member gets the requested song instrument with its video
    Given I authenticate as user "song-owner" with id "#musicianId"
    And A song instrument video exists with id "#videoId" for song instrument "#instrumentId"
    When I send a GET request to "/v1/songs/#songId/instruments/#instrumentId"
    Then the response status code should be 200
    And the response with ignored fields "createdAt,video.createdAt" should be:
      """
      {
        "id": "#instrumentId",
        "name": "Lead Guitar",
        "instrumentType": "guitar",
        "songId": "#songId",
        "musicianId": "#musicianId",
        "video": {
          "id": "#videoId",
          "songInstrumentId": "#instrumentId",
          "url": "https://example.com/song-instrument-video.mp4",
          "duration": 123,
          "size": 456
        }
      }
      """

  Scenario: A musician outside the band cannot read the song instrument
    Given An authenticated user "not-band-member" with password "asdASD123"
    And they have a musician profile
    When I send a GET request to "/v1/songs/#songId/instruments/#instrumentId"
    Then the response status code should be 403

  Scenario: An instrument that belongs to a different song is treated as not found
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a GET request to "/v1/songs/#anotherSongId/instruments/#instrumentId"
    Then the response status code should be 404
