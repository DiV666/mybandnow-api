@songInstrumentUpload
Feature: Upload a song instrument video
  As an authenticated musician
  I want to upload a song instrument recording
  So the validation workflow can start asynchronously

  Background:
    Given An authenticated user "trackuser" with password "asdASD123!"

  Scenario: A guarded song instrument upload route rejects users without a musician profile
    When I request a song instrument upload url for "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload"
    Then the response status code should be 403
    And the response should be:
      """
      {
        "code": "FORBIDDEN",
        "message": "Profile required"
      }
      """

  Scenario: A musician requests, uploads, and confirms a song instrument upload without providing a pre-existing aggregate id
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    When I request a song instrument upload url for "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload"
    Then the response status code should be 200
    When I upload a valid MP4 video to the requested upload url
    And I confirm the requested song instrument upload at "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload/#uploadId/confirm"
    Then the response status code should be 202
    And the response should be empty
    And exactly 1 internal song instrument upload should exist for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" and song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a"

  Scenario: A musician creates a new internal song instrument upload attempt for repeated uploads on the same song instrument
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    And an internal song instrument upload already exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" and song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a"
    When I request a song instrument upload url for "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload"
    Then the response status code should be 200
    When I upload a valid MP4 video to the requested upload url
    And I confirm the requested song instrument upload at "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload/#uploadId/confirm"
    Then the response status code should be 202
    And exactly 2 internal song instrument uploads should exist for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" and song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a"

  Scenario: Confirming an upload fails when the video was never actually uploaded to the signed url
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    When I request a song instrument upload url for "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload"
    Then the response status code should be 200
    When I confirm the requested song instrument upload at "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload/#uploadId/confirm"
    Then the response status code should be 400
    And the response should be:
      """
      {
        "code": "INVALID_ARGUMENT",
        "message": "Video not found, upload may have failed"
      }
      """

  Scenario: Upload fails when the authenticated musician is not assigned to the song instrument
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to another musician
    When I request a song instrument upload url for "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload"
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
    When I request a song instrument upload url for "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload"
    Then the response status code should be 404
    And the response should be:
      """
      {
        "code": "SONGINSTRUMENT_NOT_EXISTS",
        "message": "The SongInstrument id <674b21fd-b822-4461-84a1-4b6dce8dc14a> not exists."
      }
      """

  Scenario: A musician cancels a pending upload, which deletes the file from storage
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    When I request a song instrument upload url for "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload"
    And I upload a valid MP4 video to the requested upload url
    And I cancel the requested song instrument upload at "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload/#uploadId/cancel"
    Then the response status code should be 204
    And exactly 1 internal song instrument upload should exist for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" and song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a"
    When I confirm the requested song instrument upload at "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload/#uploadId/confirm"
    Then the response status code should be 400
    And the response should be:
      """
      {
        "code": "INVALID_ARGUMENT",
        "message": "Video not found, upload may have failed"
      }
      """

  Scenario: Cancelling an upload fails once it is no longer pending
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    When I request a song instrument upload url for "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload"
    And I upload a valid MP4 video to the requested upload url
    And I confirm the requested song instrument upload at "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload/#uploadId/confirm"
    And I cancel the requested song instrument upload at "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload/#uploadId/cancel"
    Then the response status code should be 409
    And the response should be:
      """
      {
        "code": "SONG_INSTRUMENT_UPLOAD_NOT_CANCELLABLE",
        "message": "SongInstrumentUpload <#uploadId> cannot be cancelled because it is in status <PROCESSING>."
      }
      """

  Scenario: Cancelling an upload fails when the authenticated musician is not assigned to the song instrument
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to another musician
    And an internal song instrument upload already exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" and song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a"
    When I cancel the requested song instrument upload at "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload/#uploadId/cancel"
    Then the response status code should be 403
    And the response should be:
      """
      {
        "code": "FORBIDDEN",
        "message": "Only the assigned musician can upload for this song instrument."
      }
      """

  Scenario: Cancelling an upload fails when the upload does not exist
    Given they have a musician profile
    And song instrument "674b21fd-b822-4461-84a1-4b6dce8dc14a" exists for song "8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb" assigned to the authenticated musician
    When I cancel the requested song instrument upload at "/v1/songs/8b0a29e5-df8d-40f5-9d57-f4ce57dbf6bb/instruments/674b21fd-b822-4461-84a1-4b6dce8dc14a/upload/3ae51c35-8b20-4e86-bff1-a2f7af8ed649/cancel"
    Then the response status code should be 404
    And the response should be:
      """
      {
        "code": "TRACK_NOT_EXISTS",
        "message": "The SongInstrumentUpload id <3ae51c35-8b20-4e86-bff1-a2f7af8ed649> not exists."
      }
      """
