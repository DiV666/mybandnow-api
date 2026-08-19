@songInstrument
Feature: List song instruments by criteria
  In order to review the arrangement of a song
  I want to list song instruments only when I belong to the song band

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
    And An "secondInstrumentId" parameter with value as "string":
    """
    $uuid
    """
    And An "otherSongInstrumentId" parameter with value as "string":
    """
    $uuid
    """
    And An "uploadAttemptId" parameter with value as "string":
    """
    $uuid
    """
    And An existing song with id "#songId" and musician "#musicianId"
    And An existing catalog instrument with id "0e7a0d5f-3d2a-4bc1-8d4d-100000000001" and name "Guitarra"
    And An existing song with id "#anotherSongId" and musician "#musicianId"
    And An existing catalog instrument with id "0e7a0d5f-3d2a-4bc1-8d4d-100000000001" and name "Guitarra"
    And A band membership exists for musician "#musicianId" in the song "#songId" band
    And A band membership exists for musician "#musicianId" in the song "#anotherSongId" band
    And An existing song instrument with id "#instrumentId" for song "#songId" and musician "#musicianId"
    And An existing song instrument with id "#secondInstrumentId" for song "#songId" and musician "#musicianId"
    And An existing song instrument with id "#otherSongInstrumentId" for song "#anotherSongId" and musician "#musicianId"

  Scenario: A band member lists the song instruments of the requested song
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a GET request to "/v1/songs/#songId/instruments?criteria=%7B%22order%22%3A%7B%22orderBy%22%3A%22createdAt%22%2C%22orderType%22%3A%22asc%22%7D%7D"
    Then the response status code should be 200
    And the response with ignored fields "items.createdAt" should be:
      """
      {
        "items": [
          {
            "id": "#instrumentId",
            "name": "Lead Guitar",
            "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
            "songId": "#songId",
            "musicianId": "#musicianId",
            "video": null,
            "upload": null
          },
          {
            "id": "#secondInstrumentId",
            "name": "Lead Guitar",
            "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
            "songId": "#songId",
            "musicianId": "#musicianId",
            "video": null,
            "upload": null
          }
        ],
        "total": 2
      }
      """

  Scenario: The path songId scope overrides a conflicting criteria songId filter
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a GET request to "/v1/songs/#songId/instruments?criteria=%7B%22filters%22%3A%5B%7B%22field%22%3A%22songId%22%2C%22operator%22%3A%22EQUAL%22%2C%22type%22%3A%22string%22%2C%22value%22%3A%22#anotherSongId%22%7D%5D%2C%22order%22%3A%7B%22orderBy%22%3A%22createdAt%22%2C%22orderType%22%3A%22asc%22%7D%7D"
    Then the response status code should be 200
    And the response with ignored fields "items.createdAt" should be:
      """
      {
        "items": [
          {
            "id": "#instrumentId",
            "name": "Lead Guitar",
            "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
            "songId": "#songId",
            "musicianId": "#musicianId",
            "video": null,
            "upload": null
          },
          {
            "id": "#secondInstrumentId",
            "name": "Lead Guitar",
            "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
            "songId": "#songId",
            "musicianId": "#musicianId",
            "video": null,
            "upload": null
          }
        ],
        "total": 2
      }
      """

  Scenario: A band member lists song instruments including a failed active upload attempt
    Given I authenticate as user "song-owner" with id "#musicianId"
    And An active failed song instrument upload attempt with id "#uploadAttemptId" exists for song instrument "#instrumentId"
    When I send a GET request to "/v1/songs/#songId/instruments?criteria=%7B%22order%22%3A%7B%22orderBy%22%3A%22createdAt%22%2C%22orderType%22%3A%22asc%22%7D%7D"
    Then the response status code should be 200
    And the response with ignored fields "items.createdAt" should be:
      """
      {
        "items": [
          {
            "id": "#instrumentId",
            "name": "Lead Guitar",
            "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
            "songId": "#songId",
            "musicianId": "#musicianId",
            "video": null,
            "upload": {
              "id": "#uploadAttemptId",
              "status": "FAILED",
              "errorMessage": "Upload processing failed. Please try again.",
              "errorCode": "PROCESSING_FAILED"
            }
          },
          {
            "id": "#secondInstrumentId",
            "name": "Lead Guitar",
            "instrumentId": "0e7a0d5f-3d2a-4bc1-8d4d-100000000001",
            "songId": "#songId",
            "musicianId": "#musicianId",
            "video": null,
            "upload": null
          }
        ],
        "total": 2
      }
      """

  Scenario: A musician outside the band cannot list the song instruments
    Given An authenticated user "not-band-member" with password "asdASD123"
    And they have a musician profile
    When I send a GET request to "/v1/songs/#songId/instruments"
    Then the response status code should be 403

  Scenario: An authenticated user without a musician profile cannot list the song instruments
    Given An authenticated user "song-instruments-no-profile" with password "asdASD123!"
    When I send a GET request to "/v1/songs/#songId/instruments"
    Then the response status code should be 403
    And the response should be:
      """
      {
        "code": "FORBIDDEN",
        "message": "Profile required"
      }
      """
