@band
Feature: List songs of a band
  In order to browse a band's catalog
  As an authenticated band member
  I want to list the songs of a band

  Background:
    Given An "bandId" parameter with value as "string":
    """
    $uuid
    """
    And An "ownerId" parameter with value as "string":
    """
    $uuid
    """
    And An "memberId" parameter with value as "string":
    """
    $uuid
    """
    And A musician exists with id "#ownerId", user id "#ownerId", and username "band-owner"
    And A musician exists with id "#memberId", user id "#memberId", and username "band-member"
    And An existing band with id "#bandId", owner "#ownerId", and member "#memberId"

  Scenario: A band member can list the songs of a band
    Given An "songId" parameter with value as "string":
    """
    $uuid
    """
    And An existing song with id "#songId", band "#bandId", and title "Road to Green"
    And I authenticate as user "band-member" with id "#memberId"
    When I send a GET request to "/v1/bands/#bandId/songs"
    Then the response status code should be 200
    And the response should be:
      """
      {
        "items": [
          {
            "id": "#songId",
            "bandId": "#bandId",
            "title": "Road to Green",
            "originalVideoclipUrl": "https://cdn.example.com/original.mp4"
          }
        ],
        "total": 1
      }
      """

  Scenario: A band member receives an empty list when the band has no songs
    Given I authenticate as user "band-member" with id "#memberId"
    When I send a GET request to "/v1/bands/#bandId/songs"
    Then the response status code should be 200
    And the response should be:
      """
      {
        "items": [],
        "total": 0
      }
      """

  Scenario: A musician outside the band cannot list songs
    Given An "outsiderId" parameter with value as "string":
    """
    $uuid
    """
    And A musician exists with id "#outsiderId", user id "#outsiderId", and username "band-outsider"
    And I authenticate as user "band-outsider" with id "#outsiderId"
    When I send a GET request to "/v1/bands/#bandId/songs"
    Then the response status code should be 403
