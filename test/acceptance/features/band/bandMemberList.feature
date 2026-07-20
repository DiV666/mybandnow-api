@band
Feature: List members of a band
  In order to render band membership without fetching the whole band resource
  As an authenticated band member
  I want to list the members of a band

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

  Scenario: A band member can list the members of a band
    Given I authenticate as user "band-member" with id "#memberId"
    When I send a GET request to "/v1/bands/#bandId/members"
    Then the response status code should be 200
    And the response should be:
      """
      {
        "items": [
          {
            "musicianId": "#ownerId",
            "role": "ADMIN"
          },
          {
            "musicianId": "#memberId",
            "role": "MEMBER"
          }
        ],
        "total": 2
      }
      """

  Scenario: A musician outside the band cannot list the members
    Given An "outsiderId" parameter with value as "string":
    """
    $uuid
    """
    And A musician exists with id "#outsiderId", user id "#outsiderId", and username "band-outsider"
    And I authenticate as user "band-outsider" with id "#outsiderId"
    When I send a GET request to "/v1/bands/#bandId/members"
    Then the response status code should be 403
