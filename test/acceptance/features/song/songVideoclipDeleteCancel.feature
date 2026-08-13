@song
Feature: Cancel a pending videoclip generation process for a song
  In order to stop an accidental or stale videoclip generation request
  I want to cancel the active videoclip generation process for a song while it is still PENDING

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
    And An "videoclipProcessId" parameter with value as "string":
    """
    $uuid
    """

  Scenario: The song owner can cancel a PENDING videoclip process
    Given An existing videoclip process with id "#videoclipProcessId" for song "#songId" and status "PENDING"
    And I authenticate as user "song-owner" with id "#musicianId"
    When I send a DELETE request to "/v1/songs/#songId/videoclip"
    Then the response status code should be 204

  Scenario: Cancelling when no videoclip process has ever been requested for the song returns 404
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a DELETE request to "/v1/songs/#songId/videoclip"
    Then the response status code should be 404

  Scenario: Cancelling for a non-existing song returns 404
    Given I authenticate as user "song-owner" with id "#musicianId"
    When I send a DELETE request to "/v1/songs/$uuid/videoclip"
    Then the response status code should be 404

  Scenario: Cancelling a videoclip process that is already MIXING returns 409
    Given An existing videoclip process with id "#videoclipProcessId" for song "#songId" and status "MIXING"
    And I authenticate as user "song-owner" with id "#musicianId"
    When I send a DELETE request to "/v1/songs/#songId/videoclip"
    Then the response status code should be 409

  Scenario Outline: Cancelling when the only process for the song already reached a terminal status returns 404
    Given An existing videoclip process with id "#videoclipProcessId" for song "#songId" and status "<status>"
    And I authenticate as user "song-owner" with id "#musicianId"
    When I send a DELETE request to "/v1/songs/#songId/videoclip"
    Then the response status code should be 404

    Examples:
      | status    |
      | SUCCESS   |
      | FAILED    |
      | TIMEOUT   |
      | CANCELLED |
