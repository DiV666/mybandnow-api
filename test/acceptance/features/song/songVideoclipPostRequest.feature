@song
Feature: Request videoclip generation for a song
  In order to start the AI videoclip generation pipeline
  I want to request a videoclip once every song instrument has an uploaded video

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
    And An "songInstrumentId" parameter with value as "string":
    """
    $uuid
    """
    And An "videoclipProcessId" parameter with value as "string":
    """
    $uuid
    """
    And An "existingVideoclipProcessId" parameter with value as "string":
    """
    $uuid
    """

  Scenario: The song owner can request a videoclip once every instrument has an uploaded video
    Given An existing song instrument with id "#songInstrumentId" for song "#songId" and musician "#musicianId"
    And An "songInstrumentVideoId" parameter with value as "string":
    """
    $uuid
    """
    And A song instrument video exists with id "#songInstrumentVideoId" for song instrument "#songInstrumentId"
    And I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/videoclip" with body:
      """
      {
        "id": "#videoclipProcessId"
      }
      """
    Then the response status code should be 202

  Scenario: Requesting a videoclip with a missing instrument video returns 400
    Given An existing song instrument with id "#songInstrumentId" for song "#songId" and musician "#musicianId"
    And I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/videoclip" with body:
      """
      {
        "id": "#videoclipProcessId"
      }
      """
    Then the response status code should be 400

  Scenario: Requesting a videoclip for a song with no instruments returns 400
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/videoclip" with body:
      """
      {
        "id": "#videoclipProcessId"
      }
      """
    Then the response status code should be 400

  Scenario: Requesting a videoclip for a non-existing song returns 404
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/$uuid/videoclip" with body:
      """
      {
        "id": "#videoclipProcessId"
      }
      """
    Then the response status code should be 404

  Scenario Outline: Requesting a videoclip while an active process exists for the song returns 409
    Given An existing song instrument with id "#songInstrumentId" for song "#songId" and musician "#musicianId"
    And An "songInstrumentVideoId" parameter with value as "string":
    """
    $uuid
    """
    And A song instrument video exists with id "#songInstrumentVideoId" for song instrument "#songInstrumentId"
    And An existing videoclip process with id "#existingVideoclipProcessId" for song "#songId" and status "<status>"
    And I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/videoclip" with body:
      """
      {
        "id": "#videoclipProcessId"
      }
      """
    Then the response status code should be 409

    Examples:
      | status  |
      | PENDING |
      | MIXING  |

  Scenario Outline: Requesting a videoclip after the previous process for the song reached a terminal status returns 202
    Given An existing song instrument with id "#songInstrumentId" for song "#songId" and musician "#musicianId"
    And An "songInstrumentVideoId" parameter with value as "string":
    """
    $uuid
    """
    And A song instrument video exists with id "#songInstrumentVideoId" for song instrument "#songInstrumentId"
    And An existing videoclip process with id "#existingVideoclipProcessId" for song "#songId" and status "<status>"
    And I authenticate as user "song-owner" with id "#musicianId"
    When I send a POST request to "/v1/songs/#songId/videoclip" with body:
      """
      {
        "id": "#videoclipProcessId"
      }
      """
    Then the response status code should be 202

    Examples:
      | status  |
      | SUCCESS |
      | FAILED  |
      | TIMEOUT |
