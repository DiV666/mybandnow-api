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
        "instrumentType": "guitar",
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
        "instrumentType": "guitar",
        "musicianId": "#musicianId"
      }
      """
    Then the response status code should be 403

  Scenario: The song owner cannot assign a different musicianId
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/instruments" with body:
      """
      {
        "id": "#id",
        "name": "Lead Guitar",
        "instrumentType": "guitar",
        "musicianId": "11111111-1111-4111-8111-111111111111"
      }
      """
    Then the response status code should be 403
    And the response should be:
      """
      {
        "code": "FORBIDDEN",
        "message": "Only the song owner can assign their own musicianId to the song instrument."
      }
      """

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
        "instrumentType": "guitar",
        "musicianId": "#musicianId"
      }
      """
    Then the response status code should be 400
