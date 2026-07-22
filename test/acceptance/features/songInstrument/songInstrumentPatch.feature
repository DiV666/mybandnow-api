@songInstrument
Feature: Patch a song instrument
  In order to keep a song arrangement accurate
  I want to edit a song instrument and reassign its musician through the split PATCH contract

  Background:
    Given An "songId" parameter with value as "string":
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
    And An "assignedMusicianId" parameter with value as "string":
    """
    $uuid
    """
    And An existing song with id "#songId" and musician "#musicianId"
    And An existing catalog instrument with id "0e7a0d5f-3d2a-4bc1-8d4d-100000000001" and name "Guitarra"
    And An existing catalog instrument with id "0e7a0d5f-3d2a-4bc1-8d4d-100000000002" and name "Bajo"
    And A musician exists with id "#assignedMusicianId", user id "#assignedMusicianId", and username "assigned-musician"
    And An existing song instrument with id "#instrumentId" for song "#songId" and musician "#musicianId"

  Scenario: The song owner edits the song instrument metadata
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a PATCH request to "/v1/songs/#songId/instruments/#instrumentId" with body:
      """
      {
        "name": "Rhythm Guitar",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000002"
      }
      """
    Then the response status code should be 200
    When I send a GET request to "/v1/songs/#songId/instruments/#instrumentId"
    Then the response status code should be 200
    And the response with ignored fields "createdAt" should be:
      """
      {
        "id": "#instrumentId",
        "name": "Rhythm Guitar",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000002",
        "songId": "#songId",
        "musicianId": "#musicianId",
        "video": null,
        "upload": null
      }
      """

  Scenario: The song owner reassigns the song instrument musician through the dedicated route
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a PATCH request to "/v1/songs/#songId/instruments/#instrumentId/musician-assign" with body:
      """
      {
        "musicianId": "#assignedMusicianId"
      }
      """
    Then the response status code should be 200
    Given I authenticate as user "assigned-musician" with id "#assignedMusicianId"
    When I send a GET request to "/v1/songs/#songId/instruments/#instrumentId"
    Then the response status code should be 200
    And the response with ignored fields "createdAt" should be:
      """
      {
        "id": "#instrumentId",
        "name": "Lead Guitar",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
        "songId": "#songId",
        "musicianId": "#assignedMusicianId",
        "video": null,
        "upload": null
      }
      """
