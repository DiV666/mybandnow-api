@songInstrument
Feature: Update a song instrument video sync start time
  In order to synchronize multi-video playback
  I want to persist the playback start offset for a song instrument video

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
    And An existing catalog instrument with id "0e7a0d5f-3d2a-4bc1-8d4d-100000000001" and name "Guitarra"
    And An existing song with id "#anotherSongId" and musician "#musicianId"
    And An existing catalog instrument with id "0e7a0d5f-3d2a-4bc1-8d4d-100000000001" and name "Guitarra"
    And A band membership exists for musician "#musicianId" in the song "#songId" band
    And An existing song instrument with id "#instrumentId" for song "#songId" and musician "#musicianId"
    And A song instrument video exists with id "#videoId" for song instrument "#instrumentId"

  Scenario: A band member updates the song instrument video sync start time
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a PATCH request to "/v1/songs/#songId/instruments/#instrumentId/video" with body:
      """
      {
        "startTimeMs": 1250
      }
      """
    Then the response status code should be 200
    When I send a GET request to "/v1/songs/#songId/instruments/#instrumentId"
    Then the response status code should be 200
    And the response with ignored fields "createdAt,video.createdAt" should be:
      """
      {
        "id": "#instrumentId",
        "name": "Lead Guitar",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
        "songId": "#songId",
        "musicianId": "#musicianId",
        "video": {
          "id": "#videoId",
          "songInstrumentId": "#instrumentId",
          "url": "https://example.com/song-instrument-video.mp4",
          "duration": 123,
          "size": 456,
          "startTimeMs": 1250
        },
        "upload": null
      }
      """

  Scenario: A song instrument video update accepts a negative offset
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a PATCH request to "/v1/songs/#songId/instruments/#instrumentId/video" with body:
      """
      {
        "startTimeMs": -500
      }
      """
    Then the response status code should be 200
    When I send a GET request to "/v1/songs/#songId/instruments/#instrumentId"
    Then the response status code should be 200
    And the response with ignored fields "createdAt,video.createdAt" should be:
      """
      {
        "id": "#instrumentId",
        "name": "Lead Guitar",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
        "songId": "#songId",
        "musicianId": "#musicianId",
        "video": {
          "id": "#videoId",
          "songInstrumentId": "#instrumentId",
          "url": "https://example.com/song-instrument-video.mp4",
          "duration": 123,
          "size": 456,
          "startTimeMs": -500
        },
        "upload": null
      }
      """

  Scenario: An instrument that belongs to a different song is treated as not found when updating sync metadata
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a PATCH request to "/v1/songs/#anotherSongId/instruments/#instrumentId/video" with body:
      """
      {
        "startTimeMs": 200
      }
      """
    Then the response status code should be 404
