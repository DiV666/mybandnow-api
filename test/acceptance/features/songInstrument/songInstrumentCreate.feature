@songInstrument
Feature: Create a new song instrument
  In order to prepare the SongInstrument POC
  I want to create a song instrument for an existing song

  Background:
    Given An "songId" parameter with value as "string":
    """
    $uuid
    """
    And An "musicianId" parameter with value as "string":
    """
    $uuid
    """
    And An existing song with id "#songId" and musician "#musicianId"
    And An existing catalog instrument with id "0e7a0d5f-3d2a-4bc1-8d4d-100000000001" and name "Guitarra"
    And An "assignedMusicianId" parameter with value as "string":
    """
    $uuid
    """
    And A musician exists with id "#assignedMusicianId", user id "#assignedMusicianId", and username "assigned-musician"
    And An "id" parameter with value as "string":
    """
    $uuid
    """

  Scenario: The song owner can create a valid song instrument
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/instruments" with body:
      """
      {
        "id": "#id",
        "name": "Lead Guitar",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
        "musicianId": "#musicianId"
      }
      """
    Then the response status code should be 201

  Scenario: A non-owner cannot create a song instrument
    Given An authenticated user "not-song-owner" with password "asdASD123"
    And they have a musician profile
    When I send a POST request to "/v1/songs/#songId/instruments" with body:
      """
      {
        "id": "#id",
        "name": "Lead Guitar",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
        "musicianId": "#musicianId"
      }
      """
    Then the response status code should be 403

  Scenario: The song owner can assign a different existing musicianId
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/instruments" with body:
      """
      {
        "id": "#id",
        "name": "Lead Guitar",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
        "musicianId": "#assignedMusicianId"
      }
      """
    Then the response status code should be 201

  Scenario: The song owner cannot assign a non-existing musicianId
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/instruments" with body:
      """
      {
        "id": "#id",
        "name": "Lead Guitar",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
        "musicianId": "$uuid"
      }
      """
    Then the response status code should be 400

  Scenario: Missing required fields returns 400
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/instruments" with body:
      """
      {
        "id": "#id",
        "name": "Lead Guitar"
      }
      """
    Then the response status code should be 400

  Scenario: songId in request body returns 400
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/instruments" with body:
      """
      {
        "id": "#id",
        "name": "Lead Guitar",
        "songId": "#songId",
        "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
        "musicianId": "#musicianId"
      }
      """
    Then the response status code should be 400
