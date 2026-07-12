@track
Feature: Upload a track video
  As an authenticated musician
  I want to upload a track recording
  So the validation workflow can start asynchronously

  Background:
    Given An authenticated user "trackuser" with password "asdASD123!"

  Scenario: A guarded track upload route rejects users without a musician profile
    When I send a multipart POST request to "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload" with a valid MP4 video
    Then the response status code should be 403
    And the response should be:
      """
      {
        "code": "FORBIDDEN",
        "message": "Profile required"
      }
      """

  Scenario: A musician can request a track upload without providing a pre-existing track id
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    When I send a multipart POST request to "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload" with a valid MP4 video
    Then the response status code should be 202
    And the response should be empty
    And exactly 1 internal track should exist for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" and song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a"

  Scenario: A musician reuses the same internal track for repeated uploads on the same song instrument
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    And an internal track already exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" and song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a"
    When I send a multipart POST request to "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload" with a valid MP4 video
    Then the response status code should be 202
    And exactly 1 internal track should exist for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" and song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a"

  Scenario: Upload fails when the multipart payload does not include the video field
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    When I send a multipart POST request to "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload" without a video file
    Then the response status code should be 400
    And the response should be:
      """
      {
        "code": "INVALID_ARGUMENT",
        "message": "No video file provided"
      }
      """

  Scenario: Upload fails when the file mime type is not mp4
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    When I send a multipart POST request to "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload" with an invalid video mime type
    Then the response status code should be 400
    And the response should be:
      """
      {
        "code": "INVALID_ARGUMENT",
        "message": "Content-Type must be video/mp4"
      }
      """

  Scenario: Upload fails when the mp4 header is corrupted
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    When I send a multipart POST request to "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload" with a corrupted MP4 header
    Then the response status code should be 400
    And the response should be:
      """
      {
        "code": "INVALID_ARGUMENT",
        "message": "Invalid file format or corrupted header"
      }
      """

  Scenario: Upload fails when the authenticated musician is not assigned to the song instrument
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to another musician
    When I send a multipart POST request to "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload" with a valid MP4 video
    Then the response status code should be 403
    And the response should be:
      """
      {
        "code": "FORBIDDEN",
        "message": "Only the assigned musician can upload for this song instrument."
      }
      """

  Scenario: Upload fails when the song instrument does not exist inside the song route
    Given they have a musician profile
    When I send a multipart POST request to "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload" with a valid MP4 video
    Then the response status code should be 404
    And the response should be:
      """
      {
        "code": "SONGINSTRUMENT_NOT_EXISTS",
        "message": "The SongInstrument id <674b21fd-b822-4461-84a1-4b6dce8dc14a> not exists."
      }
      """
